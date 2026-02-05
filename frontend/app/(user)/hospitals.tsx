import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal, ScrollView, Linking, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { useData, OSMHospital, Doctor } from '../../src/context/DataContext';
import { Card } from '../../src/components';
import { colors } from '../../src/theme/colors';

export default function Hospitals() {
  const router = useRouter();
  const { osmHospitals, isLoading, getDoctorsForHospital, hospitalDoctors } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [localityQuery, setLocalityQuery] = useState('');
  const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, any>>({});
  const [isLocating, setIsLocating] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [selectedHospital, setSelectedHospital] = useState<OSMHospital | null>(null);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const filteredHospitals = useMemo(() => {
    let list = osmHospitals;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(h => (h.name || '').toLowerCase().includes(q));
    }
    if (localityQuery) {
      const lq = localityQuery.toLowerCase();
      list = list.filter(h => {
        const location = [
          h.locality,
          h.street,
          h.city,
          h.district,
          h.state,
          h.postcode,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return location.includes(lq) || (h.name || '').toLowerCase().includes(lq);
      });
    }
    if (nearbyOnly && userLocation) {
      const withDistance = list.map(h => ({
        hospital: h,
        distanceKm: haversineKm(userLocation.latitude, userLocation.longitude, h.latitude, h.longitude),
      }));
      withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
      return withDistance.map(item => item.hospital);
    }
    return list;
  }, [osmHospitals, searchQuery, localityQuery, nearbyOnly, userLocation]);

  const renderHospital = ({ item }: { item: OSMHospital }) => {
    const addressSource = resolvedAddresses[item.id] || item;
    const distanceKm = userLocation
      ? haversineKm(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude)
      : null;
    return (
      <Card style={styles.hospitalCard} elevation="medium">
        <View style={styles.hospitalHeader}>
          <View style={styles.hospitalIcon}>
            <Ionicons name="business-outline" size={32} color={colors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.hospitalName}>{item.name}</Text>
            {addressSource?.street ? (
              <Text style={styles.localityText}>{addressSource.street}</Text>
            ) : null}
            {(addressSource?.city || addressSource?.district || addressSource?.state || addressSource?.postcode) ? (
              <Text style={styles.coordsText}>
                {[addressSource?.city, addressSource?.district, addressSource?.state, addressSource?.postcode].filter(Boolean).join(', ')}
              </Text>
            ) : (
              addressSource?.locality ? <Text style={styles.coordsText}>{addressSource.locality}</Text> : null
            )}
            {distanceKm !== null ? (
              <Text style={styles.distanceText}>{distanceKm.toFixed(1)} km away</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.viewDoctorsBtn}
            onPress={() => openDoctors(item)}
          >
            <Ionicons name="people" size={18} color={colors.primary} />
            <Text style={styles.viewDoctorsText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const requestLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setNearbyOnly(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const geocodes = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (geocodes && geocodes.length > 0) {
        const g = geocodes[0];
        const parts = [g.city, g.subregion, g.region, g.country].filter(Boolean);
        setUserAddress(parts.join(', '));
      }
    } finally {
      setIsLocating(false);
    }
  };

  const openDoctors = async (hospital: OSMHospital) => {
    setSelectedHospital(hospital);
    setDoctorModalOpen(true);
    if (!hospitalDoctors[hospital.id]) {
      setLoadingDoctors(true);
      await getDoctorsForHospital(hospital.id);
      setLoadingDoctors(false);
    }
  };

  const doctorsForSelected = selectedHospital ? (hospitalDoctors[selectedHospital.id] || []) : [];

  const openInGoogleMaps = async (hospital: OSMHospital) => {
    const lat = hospital.latitude;
    const lon = hospital.longitude;
    const label = encodeURIComponent(hospital.name || 'Hospital');
    const appUrl = Platform.select({
      ios: `comgooglemaps://?q=${lat},${lon}(${label})`,
      android: `geo:${lat},${lon}?q=${lat},${lon}(${label})`,
      default: '',
    });
    if (appUrl) {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
        return;
      }
    }
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    await Linking.openURL(webUrl);
  };

  useEffect(() => {
    if (filteredHospitals.length === 0) return;
    let cancelled = false;
    const run = async () => {
      const needs = filteredHospitals.filter(h => !h.street && !h.city && !h.district && !h.state && !h.postcode).slice(0, 20);
      if (needs.length === 0) return;
      const entries = await Promise.all(
        needs.map(async (h) => {
          try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/osm-hospitals/${h.id}/reverse`);
            if (res.ok) {
              const data = await res.json();
              return [h.id, data] as const;
            }
          } catch { }
          return [h.id, null] as const;
        })
      );
      if (!cancelled) {
        const next: Record<string, any> = {};
        for (const [id, data] of entries) {
          if (data) next[id] = data;
        }
        setResolvedAddresses(prev => ({ ...prev, ...next }));
      }
    };
    run();
    return () => { cancelled = true; };
  }, [filteredHospitals]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Hospitals (OSM)</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.nearbyBtn, nearbyOnly && styles.nearbyBtnActive]}
          onPress={async () => {
            if (!nearbyOnly && !userLocation) await requestLocation();
            setNearbyOnly(prev => !prev);
          }}
          disabled={isLocating}
        >
          <Ionicons name="navigate" size={16} color={nearbyOnly ? '#FFF' : colors.primary} />
          <Text style={[styles.nearbyBtnText, nearbyOnly && styles.nearbyBtnTextActive]}>
            {isLocating ? 'Locating...' : 'Near Me'}
          </Text>
        </TouchableOpacity>
      </View>
      {nearbyOnly && userLocation ? (
        <View style={styles.locationRow}>
          <Ionicons name="location" size={16} color={colors.textLight} />
          <Text style={styles.locationText}>
            Your location: {userAddress || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}
          </Text>
        </View>
      ) : null}

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search hospitals..."
          placeholderTextColor={colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="location-outline" size={20} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by area or city..."
          placeholderTextColor={colors.textLight}
          value={localityQuery}
          onChangeText={setLocalityQuery}
        />
        {localityQuery && (
          <TouchableOpacity onPress={() => setLocalityQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {filteredHospitals.length > 0 ? (
        <FlatList
          data={filteredHospitals}
          keyExtractor={(item) => item.id}
          renderItem={renderHospital}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No hospitals found</Text>
          <Text style={styles.emptyText}>Try a different search term.</Text>
        </View>
      )}

      <Modal
        visible={doctorModalOpen}
        animationType="slide"
        onRequestClose={() => setDoctorModalOpen(false)}
      >
        <SafeAreaView style={styles.doctorModalContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setDoctorModalOpen(false)} style={styles.backBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>{selectedHospital?.name || 'Hospital Details'}</Text>
            <View style={{ width: 44 }} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {selectedHospital && (
              <View style={styles.detailSection}>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={18} color={colors.textLight} />
                  <Text style={styles.detailText}>
                    {[selectedHospital.locality, selectedHospital.street, selectedHospital.city, selectedHospital.district, selectedHospital.state, selectedHospital.postcode]
                      .filter(Boolean)
                      .join(', ') || 'Location details not available'}
                  </Text>
                </View>
                {userLocation ? (
                  <View style={styles.detailRow}>
                    <Ionicons name="navigate" size={18} color={colors.textLight} />
                    <Text style={styles.detailText}>
                      {haversineKm(userLocation.latitude, userLocation.longitude, selectedHospital.latitude, selectedHospital.longitude).toFixed(1)} km away
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
            {selectedHospital && (
              <View style={styles.mapPreview}>
                <WebView
                  source={{
                    uri: buildOsmEmbedUrl(selectedHospital.latitude, selectedHospital.longitude),
                  }}
                  style={{ height: 220 }}
                />
                <TouchableOpacity
                  style={styles.mapActionBtn}
                  onPress={() => openInGoogleMaps(selectedHospital)}
                >
                  <Ionicons name="navigate" size={16} color="#FFF" />
                  <Text style={styles.mapActionText}>Open in Google Maps</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Doctors</Text>
            </View>
            {loadingDoctors ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={styles.doctorsList}>
                {doctorsForSelected.length > 0 ? (
                  doctorsForSelected.map((doc) => (
                    <DoctorCard
                      key={doc.id}
                      doctor={doc}
                      onPress={() => {
                        setDoctorModalOpen(false);
                        router.push({ pathname: '/(user)/booking', params: { doctorId: doc.id } });
                      }}
                    />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={64} color={colors.textLight} />
                    <Text style={styles.emptyTitle}>No doctors listed</Text>
                    <Text style={styles.emptyText}>This hospital has no doctors selected yet.</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const DoctorCard = ({ doctor, onPress }: { doctor: Doctor; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <Card style={styles.doctorCard} elevation="medium">
      <View style={styles.doctorRow}>
        <View style={styles.doctorAvatar}>
          <Ionicons name="person" size={26} color={colors.primary} />
        </View>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
          <View style={styles.doctorMetaRow}>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#FFB800" />
              <Text style={styles.ratingText}>{doctor.rating?.toFixed(1) || '4.0'}</Text>
            </View>
            <Text style={styles.doctorMetaSep}>•</Text>
            <Text style={styles.doctorMeta}>{doctor.experience} yrs exp</Text>
          </View>
        </View>
        <View style={styles.doctorPriceSection}>
          <Text style={styles.doctorFeeLabel}>Fee</Text>
          <Text style={styles.doctorFee}>₹{doctor.consultation_fee}</Text>
        </View>
      </View>
      <View style={styles.doctorActions}>
        <TouchableOpacity style={styles.viewProfileBtn} onPress={onPress}>
          <Ionicons name="eye-outline" size={16} color={colors.primary} />
          <Text style={styles.viewProfileText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookDoctorBtn} onPress={onPress}>
          <Ionicons name="calendar-outline" size={16} color="#FFF" />
          <Text style={styles.bookDoctorText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </Card>
  </TouchableOpacity>
);

const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const buildOsmEmbedUrl = (lat: number, lon: number) => {
  const delta = 0.01;
  const left = lon - delta;
  const bottom = lat - delta;
  const right = lon + delta;
  const top = lat + delta;
  const bbox = `${left},${bottom},${right},${top}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lon}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: colors.text,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  hospitalCard: {
    marginBottom: 16,
  },
  hospitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hospitalIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  localityText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  coordsText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewDoctorsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.primary + '10',
  },
  viewDoctorsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginTop: 6,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  nearbyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  nearbyBtnActive: {
    backgroundColor: colors.primary,
  },
  nearbyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  nearbyBtnTextActive: {
    color: '#FFF',
  },
  distanceText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  doctorModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  detailSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
  },
  mapPreview: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapActionBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.primary,
  },
  mapActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  doctorsList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  doctorCard: {
    marginBottom: 12,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  doctorSpec: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  doctorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B8860B',
  },
  doctorMetaSep: {
    fontSize: 12,
    color: colors.textLight,
  },
  doctorMeta: {
    fontSize: 12,
    color: colors.textLight,
  },
  doctorPriceSection: {
    alignItems: 'flex-end',
  },
  doctorFeeLabel: {
    fontSize: 10,
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  doctorFee: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  doctorActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  viewProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary + '10',
    gap: 6,
  },
  viewProfileText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  bookDoctorBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.primary,
    gap: 6,
  },
  bookDoctorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
});
