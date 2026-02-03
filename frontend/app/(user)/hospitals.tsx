import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useData, OSMHospital } from '../../src/context/DataContext';
import { Card } from '../../src/components';
import { colors } from '../../src/theme/colors';

export default function Hospitals() {
  const router = useRouter();
  const { osmHospitals, isLoading } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [localityQuery, setLocalityQuery] = useState('');
  const [mapHospital, setMapHospital] = useState<OSMHospital | null>(null);
  const [resolvedAddresses, setResolvedAddresses] = useState<Record<string, any>>({});

  const filteredHospitals = useMemo(() => {
    let list = osmHospitals;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(h => (h.name || '').toLowerCase().includes(q));
    }
    if (localityQuery) {
      const lq = localityQuery.toLowerCase();
      list = list.filter(h => {
        const locality = (h.locality || '').toLowerCase();
        if (locality) return locality.includes(lq);
        return (h.name || '').toLowerCase().includes(lq);
      });
    }
    return list;
  }, [osmHospitals, searchQuery, localityQuery]);

  const renderHospital = ({ item }: { item: OSMHospital }) => {
    const addressSource = resolvedAddresses[item.id] || item;
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
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.viewDoctorsBtn}
            onPress={() => router.push(`/(user)/osm-hospital/${item.id}`)}
          >
            <Ionicons name="people" size={18} color={colors.primary} />
            <Text style={styles.viewDoctorsText}>View Doctors</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => setMapHospital(item)}
          >
            <Ionicons name="map" size={18} color={colors.primary} />
            <Text style={styles.viewBtnText}>View on Map</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
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
          } catch {}
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
          placeholder="Filter by locality..."
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
          <Text style={styles.emptyText}>Try a different search term or add a hospital.</Text>
          <TouchableOpacity style={styles.addHospitalBtn} onPress={() => router.push('/(hospital)/profile')}>
            <Ionicons name="add-circle" size={18} color="#FFF" />
            <Text style={styles.addHospitalBtnText}>Add Hospital</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={!!mapHospital}
        animationType="slide"
        onRequestClose={() => setMapHospital(null)}
      >
        <SafeAreaView style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setMapHospital(null)} style={styles.backBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>{mapHospital?.name || 'Hospital Location'}</Text>
            <View style={{ width: 44 }} />
          </View>
          {mapHospital && (
            <WebView
              source={{
                uri: `https://www.openstreetmap.org/?mlat=${mapHospital.latitude}&mlon=${mapHospital.longitude}#map=16/${mapHospital.latitude}/${mapHospital.longitude}`,
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  hospitalCard: {
    marginBottom: 16,
    padding: 16,
  },
  hospitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  hospitalIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  localityText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewDoctorsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewDoctorsText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  viewBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  addHospitalBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addHospitalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
