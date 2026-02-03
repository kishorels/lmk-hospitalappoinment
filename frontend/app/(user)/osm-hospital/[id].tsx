import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useData } from '../../../src/context/DataContext';
import { Card, Button } from '../../../src/components';
import { colors } from '../../../src/theme/colors';

export default function OSMHospitalDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { osmHospitals, getDoctorsForHospital, hospitalDoctors } = useData();
  const [showMap, setShowMap] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<any | null>(null);
  const [doctors, setDoctors] = useState<{ id: string; name: string; specialization?: string; experience?: number; rating?: number }[]>([]);

  const hospital = useMemo(() => {
    return osmHospitals.find(h => h.id === id);
  }, [osmHospitals, id]);

  useEffect(() => {
    const needsAddress = hospital && !hospital.street && !hospital.city && !hospital.district && !hospital.state && !hospital.postcode;
    if (!hospital?.id || !needsAddress) return;
    const run = async () => {
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/osm-hospitals/${hospital.id}/reverse`);
        if (res.ok) {
          const data = await res.json();
          setResolvedAddress(data);
        }
      } catch (error) {
        console.error('Reverse geocode failed', error);
      }
    };
    run();
  }, [hospital?.id]);

  const addressSource = resolvedAddress || hospital;

  useEffect(() => {
    if (!hospital?.id) return;
    getDoctorsForHospital(hospital.id).then((items) => setDoctors(items));
  }, [hospital?.id]);

  useEffect(() => {
    if (!hospital?.id) return;
    const existing = hospitalDoctors[hospital.id];
    if (existing) setDoctors(existing);
  }, [hospitalDoctors, hospital?.id]);

  if (!hospital) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle" size={64} color={colors.error} />
          <Text style={styles.errorText}>Hospital not found</Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hospital Details</Text>
          <View style={{ width: 44 }} />
        </View>

        <Card style={styles.detailCard}>
          <View style={styles.titleRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="business" size={28} color={colors.hospitalPrimary} />
            </View>
            <View style={styles.titleInfo}>
              <Text style={styles.hospitalName}>{hospital.name}</Text>
              {addressSource?.street ? (
                <Text style={styles.localityText}>{addressSource.street}</Text>
              ) : null}
              {(addressSource?.city || addressSource?.district || addressSource?.state || addressSource?.postcode) ? (
                <Text style={styles.localityText}>
                  {[addressSource?.city, addressSource?.district, addressSource?.state, addressSource?.postcode].filter(Boolean).join(', ')}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.coordsRow}>
            <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.coordsText}>
              {addressSource?.locality || 'Location available on map'}
            </Text>
          </View>

          <TouchableOpacity style={styles.mapButton} onPress={() => setShowMap(true)}>
            <Ionicons name="map" size={18} color={colors.primary} />
            <Text style={styles.mapButtonText}>View on Map</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Doctors Working Here</Text>
          {doctors.length > 0 ? (
            doctors.map((doc) => (
              <View key={doc.id} style={styles.doctorRow}>
                <View style={styles.doctorLeft}>
                  <View style={styles.doctorIcon}>
                    <Ionicons name="medkit" size={20} color={colors.doctorPrimary} />
                  </View>
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{doc.name}</Text>
                    <Text style={styles.doctorMeta}>
                      {doc.specialization || 'Doctor'} • {doc.experience ?? 0} yrs • {(doc.rating ?? 4.0).toFixed(1)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.selectDoctorBtn}
                  onPress={() => router.push(`/(user)/doctor/${doc.id}`)}
                >
                  <Text style={styles.selectDoctorText}>Select Doctor</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyDoctorsText}>No doctors linked to this hospital yet.</Text>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showMap}
        animationType="slide"
        onRequestClose={() => setShowMap(false)}
      >
        <SafeAreaView style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity onPress={() => setShowMap(false)} style={styles.backBtn}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>{hospital.name}</Text>
            <View style={{ width: 44 }} />
          </View>
          <WebView
            source={{
              uri: `https://www.openstreetmap.org/?mlat=${hospital.latitude}&mlon=${hospital.longitude}#map=16/${hospital.latitude}/${hospital.longitude}`,
            }}
          />
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  detailCard: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.hospitalPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  titleInfo: {
    flex: 1,
  },
  hospitalName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  localityText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  coordsText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mapButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    color: colors.text,
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
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  doctorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.doctorPrimary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  doctorMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  selectDoctorBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  selectDoctorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  emptyDoctorsText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
