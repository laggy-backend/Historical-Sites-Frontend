import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterBar } from '../../components/search/FilterBar';
import { SiteCard } from '../../components/sites/SiteCard';
import { useAuth } from '../../contexts/AuthContext';
import { useSearch } from '../../contexts/SearchContext';
import {
  centerContent,
  createStyles,
  createTypographyStyle,
  flexFull,
  useTheme
} from '../../styles';
import { HistoricalSite } from '../../types/historicalSites';
import { canCreateContent } from '../../utils/permissions';

export default function Explore() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const {
    sites,
    totalCount,
    isLoading,
    isLoadingMore,
    isRefreshing,
    error,
    hasNextPage,
    loadMore,
    refresh,
    getActiveFilterCount
  } = useSearch();

  // Simple refresh on component mount/navigation
  useEffect(() => {
    refresh();
  }, []);

  const styles = createStyles((theme) => ({
    container: {
      ...flexFull,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    titleText: {
      ...createTypographyStyle(theme, 'h1'),
    },
    createButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      shadowColor: theme.colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    createButtonText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textInverse,
      fontWeight: theme.fontWeight.medium,
    },
    subtitleText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
    },
    countText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textSecondary,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
    },
    listContent: {
      paddingBottom: theme.spacing.lg,
    },
    loadingContainer: {
      ...flexFull,
      ...centerContent,
      paddingTop: theme.spacing.xxl,
    },
    errorContainer: {
      ...flexFull,
      ...centerContent,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xxl,
    },
    errorText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    emptyContainer: {
      ...flexFull,
      ...centerContent,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xxl,
    },
    emptyText: {
      ...createTypographyStyle(theme, 'body'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    emptySubText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    loadMoreContainer: {
      paddingVertical: theme.spacing.lg,
      alignItems: 'center',
    },
    loadMoreText: {
      ...createTypographyStyle(theme, 'caption'),
      color: theme.colors.textSecondary,
    },
  }))(theme);

  const canCreateSites = canCreateContent(user?.role);

  const handleSitePress = (site: HistoricalSite) => {
    router.push(`/sites/${site.id}`);
  };

  const handleCreatePress = () => {
    router.push('/upload');
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isLoadingMore) {
      loadMore();
    }
  };

  const handleRefresh = () => {
    refresh();
  };

  const renderSiteItem = ({ item }: { item: HistoricalSite }) => (
    <SiteCard site={item} onPress={handleSitePress} />
  );

  const renderLoadingFooter = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadMoreText}>Loading more sites...</Text>
      </View>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) return null;

    const activeFilterCount = getActiveFilterCount();
    const hasFilters = activeFilterCount > 0;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {hasFilters ? 'No sites match your filters' : 'No historical sites found'}
        </Text>
        <Text style={styles.emptySubText}>
          {hasFilters
            ? 'Try adjusting your search criteria'
            : canCreateSites
              ? 'Be the first to add a historical site!'
              : 'Check back later for new additions'
          }
        </Text>
      </View>
    );
  };

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleRefresh}
      >
        <Text style={styles.createButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const getResultsText = () => {
    if (totalCount === 0) return '';
    if (totalCount === 1) return '1 historical site';
    return `${totalCount.toLocaleString()} historical sites`;
  };

  if (error && sites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style={theme.isDark ? 'light' : 'dark'} />
        <View style={styles.header}>
          <Text style={styles.titleText}>Explore</Text>
        </View>
        <FilterBar disabled />
        {renderErrorState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText}>Explore</Text>
          {canCreateSites && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreatePress}
            >
              <Text style={styles.createButtonText}>Add Site</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitleText}>
          Discover historical sites and their stories
        </Text>
      </View>

      {/* Filters */}
      <FilterBar disabled={isLoading} />

      {/* Results Count */}
      {!isLoading && totalCount > 0 && (
        <Text style={styles.countText}>
          {getResultsText()}
        </Text>
      )}

      {/* Content */}
      {isLoading && sites.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadMoreText}>Loading historical sites...</Text>
        </View>
      ) : (
        <FlatList
          data={sites}
          renderItem={renderSiteItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderLoadingFooter}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}