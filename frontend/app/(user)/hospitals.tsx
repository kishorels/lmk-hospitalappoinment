import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { Card } from '../../src/components';
import { colors } from '../../src/theme/colors';
import { Hospital } from '../../src/data/mockData';

export default function Hospitals() {
  const router = useRouter();
  const { user } = useAuth();
  const { getHospitalsByLocation, hospitals: allHospitals, getDoctorsByHospital } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAllLocations, setShowAllLocations] = useState(false);

  const hospitalsInLocation = user?.selectedCity
    ? getHospitalsByLocation(user.selectedCity, user.selectedArea)
    : [];

  const displayHospitals = showAllLocations ? allHospitals : hospitalsInLocation;

  const filteredHospitals = searchQuery
    ? displayHospitals.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.departments.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : displayHospitals;

  const renderHospital = ({ item }: { item: Hospital }) => {
    const doctorCount = getDoctorsByHospital(item.id).length;
    
    return (
      <Card
        onPress={() => router.push(`/(user)/hospital/${item.id}`)}
        style={styles.hospitalCard}
        elevation="medium"
      >
        <View style={styles.hospitalHeader}>
          <View style={styles.hospitalIcon}>
            <Ionicons name="business" size={32} color={colors.hospitalPrimary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.hospitalName}>{item.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.addressRow}>
          <Ionicons name="location" size={16} color={colors.textLight} />
          <Text style={styles.addressText}>{item.address}</Text>
        </View>
        <Text style={styles.areaText}>{item.area}, {item.city}</Text>

        <View style={styles.departmentsContainer}>
          {item.departments.slice(0, 3).map((dept, index) => (
            <View key={index} style={styles.deptChip}>
              <Text style={styles.deptText}>{dept}</Text>
            </View>
          ))}
          {item.departments.length > 3 && (
            <View style={styles.deptChip}>
              <Text style={styles.deptText}>+{item.departments.length - 3}</Text>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Ionicons name="people" size={18} color={colors.primary} />
            <Text style={styles.footerText}>{doctorCount} Doctors</Text>
          </View>
          <TouchableOpacity style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hospitals</Text>
        <TouchableOpacity
          style={styles.locationToggle}
          onPress={() => setShowAllLocations(!showAllLocations)}
        >
          <Ionicons
            name={showAllLocations ? 'globe' : 'location'}
            size={18}
            color={colors.primary}
          />
          <Text style={styles.locationToggleText}>
            {showAllLocations ? 'All Locations' : 'Near Me'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search hospitals, departments..."
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
          <Text style={styles.emptyText}>
            {showAllLocations
              ? 'Try a different search term'
              : 'Try viewing all locations'}
          </Text>
          {!showAllLocations && (
            <TouchableOpacity
              style={styles.showAllBtn}
              onPress={() => setShowAllLocations(true)}
            >
              <Text style={styles.showAllBtnText}>Show All Hospitals</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  locationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  locationToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
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
    backgroundColor: colors.hospitalPrimary + '15',
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  areaText: {
    fontSize: 13,
    color: colors.textLight,
    marginBottom: 12,
    marginLeft: 22,
  },
  departmentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  deptChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deptText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  showAllBtn: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  showAllBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
});
