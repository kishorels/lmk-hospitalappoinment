import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useData, Hospital } from '../../src/context/DataContext';
import { Card } from '../../src/components';
import { colors } from '../../src/theme/colors';

export default function Hospitals() {
  const router = useRouter();
  const { hospitals, isLoading } = useData();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredHospitals = searchQuery
    ? hospitals.filter(h =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.departments.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : hospitals;

  const renderHospital = ({ item }: { item: Hospital }) => {
    return (
      <Card
        onPress={() => router.push(`/(user)/hospitals?id=${item.id}`)}
        style={styles.hospitalCard}
        elevation="medium"
      >
        <View style={styles.hospitalHeader}>
          <View style={styles.hospitalIcon}>
            <Ionicons name="business-outline" size={32} color={colors.primary} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.hospitalName}>{item.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FFB800" />
              <Text style={styles.ratingText}>{item.rating?.toFixed(1) || '4.0'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={16} color={colors.textLight} />
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
            <Ionicons name="layers-outline" size={18} color={colors.primary} />
            <Text style={styles.footerText}>{item.departments.length} Departments</Text>
          </View>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => router.push(`/(user)/hospitals?id=${item.id}`)}
          >
            <Text style={styles.viewBtnText}>Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Hospitals</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textLight} />
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
          <Text style={styles.emptyText}>Hospitals will appear here once they register</Text>
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
    backgroundColor: colors.primary + '08',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  deptText: {
    fontSize: 12,
    fontWeight: '600',
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
});
