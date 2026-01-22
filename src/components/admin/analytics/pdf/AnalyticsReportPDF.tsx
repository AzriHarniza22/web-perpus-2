import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Booking, Room, Tour, User } from '@/lib/types';
import { 
  calculateRoomAnalytics, 
  getMonthlyRoomData, 
  getDailyRoomData, 
  getRoomTimeHeatmapData, 
  getAverageGuestsByRoom, 
  getAverageReservationDurationByRoom 
} from '@/lib/roomAnalytics';
import { 
  calculateTourAnalytics, 
  calculateMonthlyTrends, 
  calculateDailyDistribution, 
  calculateTimeHeatmap 
} from '@/lib/tourAnalytics';
import { 
  aggregateUserAnalytics, 
  getDailyUserRegistrations 
} from '@/lib/userAnalytics';

// Create enhanced styles
const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 60,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    lineHeight: 1.5,
    minHeight: 400,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1 solid #3b82f6',
    paddingBottom: 10,
    fontSize: 9,
    color: '#1e40af',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1 solid #3b82f6',
    paddingTop: 10,
    fontSize: 8,
    color: '#1e40af',
  },
  pageNumber: {
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1f2937',
    fontFamily: 'Times-Bold',
    lineHeight: 1.5,
    breakAfter: 'avoid',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
    color: '#1e40af',
    borderBottom: '2 solid #3b82f6',
    paddingBottom: 8,
    fontFamily: 'Times-Bold',
    lineHeight: 1.5,
    breakAfter: 'avoid',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#374151',
    fontFamily: 'Times-Bold',
    lineHeight: 1.5,
  },
  text: {
    marginBottom: 6,
    lineHeight: 1.5,
    textAlign: 'justify',
    fontSize: 11,
    fontFamily: 'Times-Roman',
    color: '#374151',
  },
  table: {
    marginVertical: 15,
    marginBottom: 15,
    border: '1 solid #e5e7eb',
    breakInside: 'avoid',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #e5e7eb',
    paddingVertical: 8,
    flexWrap: 'wrap',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
    fontFamily: 'Times-Bold',
    fontSize: 10,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 6,
    fontSize: 8,
    minWidth: 60,
    fontFamily: 'Times-Roman',
    lineHeight: 1.5,
  },
  metricContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 6,
    borderBottom: '0.5 solid #f3f4f6',
  },
  metricLabel: {
    fontWeight: 'bold',
    color: '#374151',
    fontFamily: 'Times-Bold',
    fontSize: 10,
    lineHeight: 1.5,
  },
  metricValue: {
    color: '#1e40af',
    fontWeight: 'bold',
    fontFamily: 'Times-Bold',
    fontSize: 10,
    lineHeight: 1.5,
  },
  coverPage: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: 50,
    backgroundColor: '#f0f9ff',
  },
  coverTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#1e40af',
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  coverSubtitle: {
    fontSize: 18,
    marginBottom: 15,
    color: '#475569',
    textAlign: 'center',
    fontFamily: 'Times-Roman',
    lineHeight: 1.5,
  },
  coverInfo: {
    fontSize: 12,
    color: '#475569',
    marginTop: 20,
    textAlign: 'center',
    fontFamily: 'Times-Roman',
    lineHeight: 1.5,
  },
  tocPage: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },
  tocTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1f2937',
    fontFamily: 'Times-Bold',
    lineHeight: 1.5,
  },
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 6,
    borderBottom: '0.5 solid #f3f4f6',
  },
  tocText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'Times-Roman',
    lineHeight: 1.5,
  },
  tocPageNum: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Times-Roman',
    lineHeight: 1.5,
  },
  heatmapContainer: {
    flexDirection: 'row',
    marginVertical: 15,
    padding: 10,
    border: '1 solid #e5e7eb',
    backgroundColor: '#f9fafb',
  },
  heatmapCell: {
    width: 22,
    height: 22,
    margin: 1,
    borderRadius: 3,
  },
  chartContainer: {
    marginVertical: 15,
    padding: 15,
    border: '1 solid #e5e7eb',
    backgroundColor: '#fafafa',
    breakInside: 'avoid',
  },
  gridContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  gridHeader: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 5,
    backgroundColor: '#f3f4f6',
    border: '0.5 solid #e5e7eb',
    fontFamily: 'Times-Bold',
    lineHeight: 1.5,
  },
  gridRow: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #e5e7eb',
  },
  gridCell: {
    flex: 1,
    fontSize: 8,
    textAlign: 'center',
    paddingVertical: 4,
    border: '0.5 solid #e5e7eb',
    fontFamily: 'Times-Roman',
    lineHeight: 1.5,
  },
  // Heatmap color scale
  heatmapVeryLow: { backgroundColor: '#f0f9ff' },
  heatmapLow: { backgroundColor: '#dbeafe' },
  heatmapMedium: { backgroundColor: '#93c5fd' },
  heatmapHigh: { backgroundColor: '#3b82f6' },
  heatmapVeryHigh: { backgroundColor: '#1e40af' },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginVertical: 2,
  },
  legendBox: {
    width: 12,
    height: 12,
    marginRight: 4,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 8,
    color: '#374151',
    fontFamily: 'Times-Roman',
    lineHeight: 1.5,
  },
  // Watermark style
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 72,
    color: '#e0f2fe',
    opacity: 0.3,
    fontFamily: 'Times-Bold',
    zIndex: -1,
  },
  // New styles for enhanced layout
  twoColumnLayout: {
    flexDirection: 'row',
    gap: 25,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  statBox: {
    padding: 12,
    marginVertical: 6,
    marginBottom: 16,
    backgroundColor: '#f0f9ff',
    border: '1 solid #3b82f6',
    borderRadius: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    fontFamily: 'Times-Bold',
    lineHeight: 1.4,
  },
  statLabel: {
    fontSize: 11,
    color: '#475569',
    marginTop: 3,
    fontFamily: 'Times-Roman',
    lineHeight: 1.4,
  },
});

interface AnalyticsReportPDFProps {
  bookings: Booking[];
  rooms: Room[];
  tours: Tour[];
  users: User[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  exportDate: Date;
  userName: string;
}

interface HeatmapCell {
  hour: number;
  day: string;
  count: number;
  intensity: number;
}

// Type conversion utility
const convertToRoomBooking = (booking: Booking) => ({
  ...booking,
  guest_count: booking.guest_count || undefined,
  event_description: booking.event_description || undefined,
  notes: booking.notes || undefined
} as any);

export const AnalyticsReportPDF: React.FC<AnalyticsReportPDFProps> = ({
  bookings,
  rooms,
  tours,
  users,
  dateRange,
  exportDate,
  userName,
}) => {
  // Calculate date range filter
  const isShortRange = dateRange ? 
    (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24) <= 7 : false;

  // Convert bookings to RoomBooking format for analytics functions
  const roomBookings = bookings.map(convertToRoomBooking);

  // Calculate comprehensive analytics
  const roomAnalyticsMap = calculateRoomAnalytics(roomBookings, rooms);
  const tourAnalytics = calculateTourAnalytics(bookings, tours);
  const userAnalytics = aggregateUserAnalytics(bookings, users);

  // Calculate reservation heatmap data
  const reservationHeatmap = getRoomTimeHeatmapData(roomBookings);

  // Generate heatmap grid data
  const heatmapGrid = React.useMemo(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const grid = days.map((day, dayIndex) => {
      return hours.map((hour) => {
        const cell = reservationHeatmap.find(
          h => h.day === day && h.hour === hour
        );
        return cell || { count: 0, intensity: 0 };
      });
    });

    return { days, hours, grid };
  }, [reservationHeatmap]);

  // Get peak hours analysis
  const peakHours = React.useMemo(() => {
    const hourCounts = new Map<number, number>();
    bookings.forEach(booking => {
      const hour = new Date(booking.start_time).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    const sortedHours = Array.from(hourCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: `${hour}:00`, count }));
    
    return sortedHours;
  }, [bookings]);

  // Get monthly trends
  const monthlyTrends = React.useMemo(() => {
    if (isShortRange) {
      return getDailyRoomData(roomBookings);
    }
    return getMonthlyRoomData(roomBookings);
  }, [roomBookings, isShortRange]);

  // Tour heatmap data
  const tourHeatmap = React.useMemo(() => {
    return calculateTimeHeatmap(bookings.filter(b => b.is_tour));
  }, [bookings]);

  // User registration trends
  const userRegistrationTrends = React.useMemo(() => {
    if (isShortRange) {
      return getDailyUserRegistrations(users, bookings);
    }
    return userAnalytics.userRegistrationTrend;
  }, [users, bookings, isShortRange, userAnalytics]);

  return (
    <Document>
      {/* Enhanced Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 40 }}>
          {/* Logo */}
          <View style={{ marginBottom: 40, alignItems: 'center' }}>
            <Image
              src="/logo.svg"
              style={{ width: 140, height: 140 }}
            />
          </View>

          <Text style={styles.coverTitle}>LAPORAN ANALYTICS</Text>
          <Text style={styles.coverTitle}>PERPUSTAKAAN ACEH</Text>

          <View style={{ marginTop: 20, marginBottom: 15 }}>
            <Text style={styles.coverSubtitle}>
              Sistem Reservasi Ruangan dan Tour Komprehensif
            </Text>
          </View>

          {dateRange && (
            <View style={{ marginBottom: 15, alignItems: 'center' }}>
              <Text style={styles.coverInfo}>
                Periode Analisis
              </Text>
              <Text style={styles.coverInfo}>
                {format(dateRange.start, 'dd MMMM yyyy', { locale: id })} - {format(dateRange.end, 'dd MMMM yyyy', { locale: id })}
              </Text>
            </View>
          )}

          <View style={{ marginTop: 30, alignItems: 'center' }}>
            <Text style={styles.coverInfo}>
              Tanggal Export: {format(exportDate, 'dd MMMM yyyy HH:mm', { locale: id })}
            </Text>
            <Text style={styles.coverInfo}>
              Generated by: {userName}
            </Text>
          </View>
        </View>
      </Page>

      {/* Table of Contents */}
      <Page size="A4" style={styles.tocPage}>
        <View style={styles.header}>
          <Text>Library Analytics Report</Text>
          <Text>{format(exportDate, 'dd/MM/yyyy')}</Text>
        </View>
        <Text style={styles.tocTitle}>DAFTAR ISI</Text>
        
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>1. Cover Page</Text>
          <Text style={styles.tocPageNum}>1</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>2. Informasi Umum</Text>
          <Text style={styles.tocPageNum}>3</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>   2.1 Ringkasan Statistik</Text>
          <Text style={styles.tocPageNum}>4</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>   2.2 Heatmap Reservasi</Text>
          <Text style={styles.tocPageNum}>5</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>3. Analisis Ruangan</Text>
          <Text style={styles.tocPageNum}>6</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>   3.1 Daftar Ruangan</Text>
          <Text style={styles.tocPageNum}>7</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>   3.2 Analisis Detail Ruangan</Text>
          <Text style={styles.tocPageNum}>8</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>4. Analisis Tour</Text>
          <Text style={styles.tocPageNum}>9</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>   4.1 Heatmap Tour</Text>
          <Text style={styles.tocPageNum}>10</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>5. Analisis Pengguna</Text>
          <Text style={styles.tocPageNum}>11</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>   5.1 Top Institutions</Text>
          <Text style={styles.tocPageNum}>12</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>   5.2 Top Users</Text>
          <Text style={styles.tocPageNum}>13</Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: '#1e40af', fontFamily: 'Times-Roman' }}>
            Generated: {format(exportDate, 'dd/MM/yyyy HH:mm', { locale: id })} | Version 1.0.0
          </Text>
          <Text style={styles.pageNumber}>Page {2}</Text>
        </View>
      </Page>

      {/* General Information Chapter */}
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>PERPUSTAKAAN ACEH</Text>

        <View style={styles.header}>
          <Image
            src="/logo.svg"
            style={{ width: 30, height: 30, marginRight: 10 }}
          />
          <Text>Library Analytics Report</Text>
          <Text>{format(exportDate, 'dd/MM/yyyy')}</Text>
        </View>
        <Text style={styles.title}>2. INFORMASI UMUM</Text>

        <Text style={styles.sectionTitle}>2.1 Ringkasan Statistik</Text>
        
        <View style={styles.twoColumnLayout}>
          <View style={styles.leftColumn}>
            <Text style={styles.subsectionTitle}>Statistik Utama</Text>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{bookings.filter(b => b.status !== 'cancelled').length}</Text>
              <Text style={styles.statLabel}>Total Reservasi</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {bookings.filter(b => b.status === 'approved' || b.status === 'completed').length}
              </Text>
              <Text style={styles.statLabel}>Disetujui</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {bookings.filter(b => b.status === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Menunggu</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {bookings.filter(b => b.status === 'rejected').length}
              </Text>
              <Text style={styles.statLabel}>Ditolak</Text>
            </View>
          </View>
          
          <View style={styles.rightColumn}>
            <Text style={styles.subsectionTitle}>Statistik Tambahan</Text>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{rooms.length}</Text>
              <Text style={styles.statLabel}>Total Ruangan</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {bookings.reduce((sum, b) => sum + (b.guest_count || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Total Guests</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{users.length}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {bookings.filter(b => b.status !== 'cancelled').length > 0
                  ? ((bookings.filter(b => b.status === 'approved' || b.status === 'completed').length / bookings.filter(b => b.status !== 'cancelled').length) * 100).toFixed(1)
                  : '0'}%
              </Text>
              <Text style={styles.statLabel}>Tingkat Persetujuan</Text>
            </View>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Peak Hours</Text>
        {peakHours.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Jam</Text>
              <Text style={styles.tableCell}>Jumlah Reservasi</Text>
            </View>
            {peakHours.slice(0, 12).map(({ hour, count }, index) => (
              <View key={hour} style={styles.tableRow}>
                <Text style={styles.tableCell}>{hour}</Text>
                <Text style={styles.tableCell}>{count}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.text}>No data available</Text>
        )}

        <Text style={styles.subsectionTitle}>
          {isShortRange ? 'Tren Harian' : 'Tren Bulanan'}
        </Text>
        {Array.from(monthlyTrends.entries()).length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Periode</Text>
              <Text style={styles.tableCell}>Total</Text>
              <Text style={styles.tableCell}>Disetujui</Text>
              <Text style={styles.tableCell}>Menunggu</Text>
              <Text style={styles.tableCell}>Ditolak</Text>
            </View>
            {Array.from(monthlyTrends.entries()).slice(0, 12).map(([period, data]) => (
              <View key={period} style={styles.tableRow}>
                <Text style={styles.tableCell}>{period}</Text>
                <Text style={styles.tableCell}>{data.total || 0}</Text>
                <Text style={styles.tableCell}>{data.approved || 0}</Text>
                <Text style={styles.tableCell}>{data.pending || 0}</Text>
                <Text style={styles.tableCell}>{data.rejected || 0}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.text}>No data available</Text>
        )}

        {/* Summary Box for General Information */}
        <View style={[styles.statBox, { marginTop: 20, backgroundColor: '#f0f9ff', borderColor: '#0ea5e9' }]}>
          <Text style={[styles.text, { fontSize: 12, fontWeight: 'bold', color: '#0c4a6e', textAlign: 'center' }]}>
            Key Insights - General Information
          </Text>
          <Text style={[styles.text, { fontSize: 10, color: '#0c4a6e', marginTop: 5 }]}>
            • Total bookings: {bookings.filter(b => b.status !== 'cancelled').length} with {bookings.filter(b => b.status === 'approved' || b.status === 'completed').length} approved
          </Text>
          <Text style={[styles.text, { fontSize: 10, color: '#0c4a6e' }]}>
            • Peak activity at {peakHours[0]?.hour || 'N/A'} with {peakHours[0]?.count || 0} bookings
          </Text>
          <Text style={[styles.text, { fontSize: 10, color: '#0c4a6e' }]}>
            • Overall approval rate: {bookings.filter(b => b.status !== 'cancelled').length > 0 ? ((bookings.filter(b => b.status === 'approved' || b.status === 'completed').length / bookings.filter(b => b.status !== 'cancelled').length) * 100).toFixed(1) : '0'}%
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: '#1e40af', fontFamily: 'Times-Roman' }}>
            Generated: {format(exportDate, 'dd/MM/yyyy HH:mm', { locale: id })} | Version 1.0.0
          </Text>
          <Text style={styles.pageNumber}>Page {3}</Text>
        </View>
      </Page>

      {/* Reservation Heatmap */}
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>PERPUSTAKAAN ACEH</Text>

        <View style={styles.header}>
          <Image
            src="/logo.svg"
            style={{ width: 30, height: 30, marginRight: 10 }}
          />
          <Text>Library Analytics Report</Text>
          <Text>{format(exportDate, 'dd/MM/yyyy')}</Text>
        </View>
        <Text style={styles.sectionTitle}>2.2 Heatmap Reservasi</Text>

        <Text style={styles.text}>
          Heatmap berikut menunjukkan pola reservasi berdasarkan hari dan jam. 
          Warna yang lebih gelap menunjukkan intensitas reservasi yang lebih tinggi.
        </Text>

        <View style={styles.chartContainer}>
          <Text style={styles.subsectionTitle}>Pola Reservasi per Hari dan Jam</Text>

          {/* Heatmap Grid */}
          <View>
            {/* Operating Hours Section (08:00 - 18:00) */}
            <Text style={[styles.text, { fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 15, color: '#374151' }]}>
              Jam Operasional (08:00 - 18:00)
            </Text>
            {/* Hour headers - Operating hours (8-18) */}
            <View style={[styles.gridContainer, { marginBottom: 0 }]}>
              <Text style={[styles.gridHeader, { flex: 2 }]}>Hari/Jam</Text>
              {heatmapGrid.hours.slice(8, 19).map(hour => (
                <Text key={hour} style={styles.gridHeader}>{hour.toString().padStart(2, '0')}:00</Text>
              ))}
            </View>

            {/* Heatmap rows - Operating hours */}
            {heatmapGrid.days.map((day, dayIndex) => (
              <View key={day} style={styles.gridRow}>
                <Text style={[styles.gridHeader, { flex: 2, fontSize: 9 }]}>{day}</Text>
                {heatmapGrid.grid[dayIndex].slice(8, 19).map((cell, hourIndex) => {
                  let heatStyle;
                  if (cell.intensity > 80) heatStyle = styles.heatmapVeryHigh;
                  else if (cell.intensity > 60) heatStyle = styles.heatmapHigh;
                  else if (cell.intensity > 40) heatStyle = styles.heatmapMedium;
                  else if (cell.intensity > 20) heatStyle = styles.heatmapLow;
                  else heatStyle = styles.heatmapVeryLow;

                  return (
                    <View key={hourIndex} style={[styles.gridCell, heatStyle]}>
                      <Text style={{ fontSize: 7, textAlign: 'center', color: cell.intensity > 60 ? 'white' : 'black' }}>
                        {cell.count}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.heatmapVeryLow]} />
              <Text style={styles.legendText}>Very Low (0-20%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.heatmapLow]} />
              <Text style={styles.legendText}>Low (20-40%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.heatmapMedium]} />
              <Text style={styles.legendText}>Medium (40-60%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.heatmapHigh]} />
              <Text style={styles.legendText}>High (60-80%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.heatmapVeryHigh]} />
              <Text style={styles.legendText}>Very High (80%+)</Text>
            </View>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Analisis Pola Reservasi</Text>
        <Text style={styles.text}>
          Berdasarkan heatmap di atas, dapat dilihat bahwa:
        </Text>
        <Text style={styles.text}>
          • Peak hour terjadi pada jam {peakHours[0]?.hour || 'N/A'} dengan {peakHours[0]?.count || 0} reservasi
        </Text>
        <Text style={styles.text}>
          • Hari dengan aktivitas tertinggi: {heatmapGrid.days[0] || 'N/A'}
        </Text>
        <Text style={styles.text}>
          • Waktu dengan aktivitas terendah: {(heatmapGrid.days[6] || 'N/A')} {(heatmapGrid.hours[22] || 22).toString().padStart(2, '0')}:00
        </Text>

        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: '#1e40af', fontFamily: 'Times-Roman' }}>
            Generated: {format(exportDate, 'dd/MM/yyyy HH:mm', { locale: id })} | Version 1.0.0
          </Text>
          <Text style={styles.pageNumber}>Page {4}</Text>
        </View>
      </Page>

      {/* Rooms Chapter */}
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>PERPUSTAKAAN ACEH</Text>

        <View style={styles.header}>
          <Image
            src="/logo.svg"
            style={{ width: 30, height: 30, marginRight: 10 }}
          />
          <Text>Library Analytics Report</Text>
          <Text>{format(exportDate, 'dd/MM/yyyy')}</Text>
        </View>
        <Text style={styles.title}>3. ANALISIS RUANGAN</Text>

        <Text style={styles.sectionTitle}>3.1 Daftar Ruangan</Text>

        <View style={styles.twoColumnLayout}>
          <View style={styles.leftColumn}>
            <Text style={styles.subsectionTitle}>Statistik Ruangan</Text>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Total Reservasi Ruangan:</Text>
              <Text style={styles.metricValue}>
                {bookings.filter(b => !b.is_tour).length}
              </Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Disetujui:</Text>
              <Text style={styles.metricValue}>
                {bookings.filter(b => !b.is_tour && (b.status === 'approved' || b.status === 'completed')).length}
              </Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Menunggu:</Text>
              <Text style={styles.metricValue}>
                {bookings.filter(b => !b.is_tour && b.status === 'pending').length}
              </Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Ditolak:</Text>
              <Text style={styles.metricValue}>
                {bookings.filter(b => !b.is_tour && b.status === 'rejected').length}
              </Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Total Guests:</Text>
              <Text style={styles.metricValue}>
                {bookings.filter(b => !b.is_tour).reduce((sum, b) => sum + (b.guest_count || 0), 0)}
              </Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Rata-rata Durasi:</Text>
              <Text style={styles.metricValue}>
                {(() => {
                  const approvedBookings = bookings.filter(b => !b.is_tour && (b.status === 'approved' || b.status === 'completed'));
                  const avgDuration = approvedBookings.length > 0
                    ? approvedBookings.reduce((sum, b) => {
                        const start = new Date(b.start_time).getTime();
                        const end = new Date(b.end_time).getTime();
                        return sum + (end - start) / (1000 * 60 * 60);
                      }, 0) / approvedBookings.length
                    : 0;
                  return `${avgDuration.toFixed(1)} jam`;
                })()}
              </Text>
            </View>
          </View>
          
          <View style={styles.rightColumn}>
            <Text style={styles.subsectionTitle}>Room List</Text>
            {rooms.length > 0 ? (
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, { flex: 1.5 }]}>Nama Ruangan</Text>
                  <Text style={styles.tableCell}>Kapasitas</Text>
                  <Text style={styles.tableCell}>Bookings</Text>
                </View>
                {rooms.slice(0, 12).map(room => {
                  const roomBookings = bookings.filter(b => b.room_id === room.id && !b.is_tour);
                  return (
                    <View key={room.id} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1.5, fontSize: 8 }]}>{room.name || 'N/A'}</Text>
                      <Text style={styles.tableCell}>{room.capacity || 0}</Text>
                      <Text style={styles.tableCell}>{roomBookings.length}</Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.text}>No rooms available</Text>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: '#1e40af', fontFamily: 'Times-Roman' }}>
            Generated: {format(exportDate, 'dd/MM/yyyy HH:mm', { locale: id })} | Version 1.0.0
          </Text>
          <Text style={styles.pageNumber}>Page {5}</Text>
        </View>
      </Page>

      {/* Room Analytics Detail */}
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>PERPUSTAKAAN ACEH</Text>

        <View style={styles.header}>
          <Image
            src="/logo.svg"
            style={{ width: 30, height: 30, marginRight: 10 }}
          />
          <Text>Library Analytics Report</Text>
          <Text>{format(exportDate, 'dd/MM/yyyy')}</Text>
        </View>
        <Text style={styles.sectionTitle}>3.2 Analisis Detail Ruangan</Text>

        <Text style={styles.subsectionTitle}>
          {isShortRange ? 'Tren Harian Ruangan' : 'Tren Bulanan Ruangan'}
        </Text>
        {Array.from(monthlyTrends.entries()).length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>Periode</Text>
              <Text style={styles.tableCell}>Total</Text>
              <Text style={styles.tableCell}>Disetujui</Text>
              <Text style={styles.tableCell}>Guests</Text>
              <Text style={styles.tableCell}>Rata-rata</Text>
            </View>
            {Array.from(monthlyTrends.entries()).slice(0, 12).map(([period, data]) => (
              <View key={period} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{period}</Text>
                <Text style={styles.tableCell}>{data.total || 0}</Text>
                <Text style={styles.tableCell}>{data.approved || 0}</Text>
                <Text style={styles.tableCell}>
                  {bookings.filter(b => {
                    const bookingDate = new Date(b.created_at).toISOString().split('T')[0];
                    return bookingDate === period && !b.is_tour;
                  }).reduce((sum, b) => sum + (b.guest_count || 0), 0)}
                </Text>
                <Text style={styles.tableCell}>
                  {data.approved > 0
                    ? (bookings.filter(b => {
                        const bookingDate = new Date(b.created_at).toISOString().split('T')[0];
                        return bookingDate === period && !b.is_tour && (b.status === 'approved' || b.status === 'completed');
                      }).reduce((sum, b) => sum + (b.guest_count || 0), 0) / data.approved).toFixed(1)
                    : '0'
                  }
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.text}>No room trend data available</Text>
        )}

        <Text style={styles.subsectionTitle}>Average Guests per Room</Text>
        {getAverageGuestsByRoom(roomBookings).length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Nama Ruangan</Text>
              <Text style={styles.tableCell}>Rata-rata Guests</Text>
              <Text style={styles.tableCell}>Total Bookings</Text>
              <Text style={styles.tableCell}>Utilization</Text>
            </View>
            {getAverageGuestsByRoom(roomBookings).slice(0, 12).map(room => (
              <View key={room.name} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{room.name || 'N/A'}</Text>
                <Text style={styles.tableCell}>{room.averageGuests || 0}</Text>
                <Text style={styles.tableCell}>{room.bookingCount || 0}</Text>
                <Text style={styles.tableCell}>{room.utilizationRate || 0}%</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.text}>No room analytics data available</Text>
        )}

        {/* Summary Box for Room Analysis */}
        <View style={[styles.statBox, { marginTop: 20, backgroundColor: '#f0fdf4', borderColor: '#22c55e' }]}>
          <Text style={[styles.text, { fontSize: 12, fontWeight: 'bold', color: '#166534', textAlign: 'center' }]}>
            Key Insights - Room Analysis
          </Text>
          <Text style={[styles.text, { fontSize: 10, color: '#166534', marginTop: 5 }]}>
            • Total room bookings: {bookings.filter(b => !b.is_tour).length}
          </Text>
          <Text style={[styles.text, { fontSize: 10, color: '#166534' }]}>
            • Most popular room: {rooms[0]?.name || 'N/A'} with {bookings.filter(b => b.room_id === rooms[0]?.id && !b.is_tour).length} bookings
          </Text>
          <Text style={[styles.text, { fontSize: 10, color: '#166534' }]}>
            • Average room utilization: {getAverageGuestsByRoom(roomBookings).length > 0 ? (getAverageGuestsByRoom(roomBookings).reduce((sum, room) => sum + (room.utilizationRate || 0), 0) / getAverageGuestsByRoom(roomBookings).length).toFixed(1) : '0'}%
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: '#1e40af', fontFamily: 'Times-Roman' }}>
            Generated: {format(exportDate, 'dd/MM/yyyy HH:mm', { locale: id })} | Version 1.0.0
          </Text>
          <Text style={styles.pageNumber}>Page {6}</Text>
        </View>
      </Page>

      {/* Tours Chapter */}
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>PERPUSTAKAAN ACEH</Text>

        <View style={styles.header}>
          <Image
            src="/logo.svg"
            style={{ width: 30, height: 30, marginRight: 10 }}
          />
          <Text>Library Analytics Report</Text>
          <Text>{format(exportDate, 'dd/MM/yyyy')}</Text>
        </View>
        <Text style={styles.title}>4. ANALISIS TOUR</Text>

        <Text style={styles.sectionTitle}>4.1 Statistik Tour</Text>

        <View style={styles.twoColumnLayout}>
          <View style={styles.leftColumn}>
            <Text style={styles.subsectionTitle}>Statistik Utama</Text>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Total Reservasi Tour:</Text>
              <Text style={styles.metricValue}>{tourAnalytics.totalBookings}</Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Disetujui:</Text>
              <Text style={styles.metricValue}>{tourAnalytics.approvedBookings}</Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Menunggu:</Text>
              <Text style={styles.metricValue}>{tourAnalytics.pendingBookings}</Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Ditolak:</Text>
              <Text style={styles.metricValue}>{tourAnalytics.rejectedBookings}</Text>
            </View>
          </View>
          
          <View style={styles.rightColumn}>
            <Text style={styles.subsectionTitle}>Statistik Peserta</Text>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Total Participants:</Text>
              <Text style={styles.metricValue}>{tourAnalytics.totalParticipants}</Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Rata-rata Participants:</Text>
              <Text style={styles.metricValue}>{tourAnalytics.avgParticipants}</Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Rata-rata Durasi:</Text>
              <Text style={styles.metricValue}>{tourAnalytics.avgDuration} jam</Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Peak Hour:</Text>
              <Text style={styles.metricValue}>{tourAnalytics.peakHour}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>
          {isShortRange ? 'Tren Harian Tour' : 'Tren Bulanan Tour'}
        </Text>
        {tourAnalytics.monthlyTrends.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Periode</Text>
              <Text style={styles.tableCell}>Total Tour</Text>
              <Text style={styles.tableCell}>Disetujui</Text>
              <Text style={styles.tableCell}>Participants</Text>
              <Text style={styles.tableCell}>Rata-rata</Text>
            </View>
            {tourAnalytics.monthlyTrends.slice(0, 12).map(trend => (
              <View key={trend.month} style={styles.tableRow}>
                <Text style={styles.tableCell}>{trend.month}</Text>
                <Text style={styles.tableCell}>{trend.total || 0}</Text>
                <Text style={styles.tableCell}>{trend.approved || 0}</Text>
                <Text style={styles.tableCell}>{trend.participants || 0}</Text>
                <Text style={styles.tableCell}>
                  {trend.approved > 0 ? (trend.participants / trend.approved).toFixed(1) : '0'}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.text}>No tour trend data available</Text>
        )}

        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: '#1e40af', fontFamily: 'Times-Roman' }}>
            Generated: {format(exportDate, 'dd/MM/yyyy HH:mm', { locale: id })} | Version 1.0.0
          </Text>
          <Text style={styles.pageNumber}>Page {7}</Text>
        </View>
      </Page>

      {/* Tours Heatmap */}
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>PERPUSTAKAAN ACEH</Text>

        <View style={styles.header}>
          <Image
            src="/logo.svg"
            style={{ width: 30, height: 30, marginRight: 10 }}
          />
          <Text>Library Analytics Report</Text>
          <Text>{format(exportDate, 'dd/MM/yyyy')}</Text>
        </View>
        <Text style={styles.sectionTitle}>4.2 Heatmap Tour</Text>

        <Text style={styles.text}>
          Heatmap berikut menunjukkan pola partisipasi tour berdasarkan hari dan jam.
        </Text>

        <View style={styles.chartContainer}>
          <Text style={styles.subsectionTitle}>Pola Tour per Hari dan Jam</Text>

          {/* Tour Heatmap Grid */}
          <View>
            {/* Operating Hours Section (08:00 - 18:00) */}
            <Text style={[styles.text, { fontSize: 10, fontWeight: 'bold', marginBottom: 8, marginTop: 15, color: '#374151' }]}>
              Jam Operasional (08:00 - 18:00)
            </Text>
            {/* Hour headers - Operating hours (8-18) */}
            <View style={[styles.gridContainer, { marginBottom: 0 }]}>
              <Text style={[styles.gridHeader, { flex: 2 }]}>Hari/Jam</Text>
              {Array.from({ length: 11 }, (_, i) => i + 8).map(hour => (
                <Text key={hour} style={styles.gridHeader}>{hour.toString().padStart(2, '0')}:00</Text>
              ))}
            </View>

            {/* Heatmap rows - Operating hours */}
            {tourHeatmap.days.map((day, dayIndex) => (
              <View key={day} style={styles.gridRow}>
                <Text style={[styles.gridHeader, { flex: 2, fontSize: 9 }]}>{day}</Text>
                {Array.from({ length: 11 }, (_, i) => i + 8).map((hour, hourIndex) => {
                  const cellValue = tourHeatmap.grid[dayIndex]?.[hour] || 0;
                  const intensity = tourHeatmap.maxValue > 0 ? (cellValue / tourHeatmap.maxValue) * 100 : 0;

                  let heatStyle;
                  if (intensity > 80) heatStyle = styles.heatmapVeryHigh;
                  else if (intensity > 60) heatStyle = styles.heatmapHigh;
                  else if (intensity > 40) heatStyle = styles.heatmapMedium;
                  else if (intensity > 20) heatStyle = styles.heatmapLow;
                  else heatStyle = styles.heatmapVeryLow;

                  return (
                    <View key={hourIndex} style={[styles.gridCell, heatStyle]}>
                      <Text style={{ fontSize: 7, textAlign: 'center', color: intensity > 60 ? 'white' : 'black' }}>
                        {cellValue}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.heatmapVeryLow]} />
              <Text style={styles.legendText}>Very Low (0-20%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.heatmapLow]} />
              <Text style={styles.legendText}>Low (20-40%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.heatmapMedium]} />
              <Text style={styles.legendText}>Medium (40-60%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.heatmapHigh]} />
              <Text style={styles.legendText}>High (60-80%)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.heatmapVeryHigh]} />
              <Text style={styles.legendText}>Very High (80%+)</Text>
            </View>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Analisis Pola Tour</Text>
        <Text style={styles.text}>
          Berdasarkan heatmap tour di atas:
        </Text>
        <Text style={styles.text}>
          • Peak hour tour: {tourAnalytics.peakHour || 'N/A'}
        </Text>
        <Text style={styles.text}>
          • Total participants: {tourAnalytics.totalParticipants || 0} orang
        </Text>
        <Text style={styles.text}>
          • Rata-rata participants per tour: {tourAnalytics.avgParticipants || 0} orang
        </Text>

        {/* Summary Box for Tour Analysis */}
        <View style={[styles.statBox, { marginTop: 20, backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
          <Text style={[styles.text, { fontSize: 12, fontWeight: 'bold', color: '#92400e', textAlign: 'center' }]}>
            Key Insights - Tour Analysis
          </Text>
          <Text style={[styles.text, { fontSize: 10, color: '#92400e', marginTop: 5 }]}>
            • Total tour bookings: {tourAnalytics.totalBookings || 0}
          </Text>
          <Text style={[styles.text, { fontSize: 10, color: '#92400e' }]}>
            • Total participants served: {tourAnalytics.totalParticipants || 0}
          </Text>
          <Text style={[styles.text, { fontSize: 10, color: '#92400e' }]}>
            • Average participants per tour: {tourAnalytics.avgParticipants || 0}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: '#1e40af', fontFamily: 'Times-Roman' }}>
            Generated: {format(exportDate, 'dd/MM/yyyy HH:mm', { locale: id })} | Version 1.0.0
          </Text>
          <Text style={styles.pageNumber}>Page {8}</Text>
        </View>
      </Page>

      {/* Users Chapter */}
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>PERPUSTAKAAN ACEH</Text>

        <View style={styles.header}>
          <Image
            src="/logo.svg"
            style={{ width: 30, height: 30, marginRight: 10 }}
          />
          <Text>Library Analytics Report</Text>
          <Text>{format(exportDate, 'dd/MM/yyyy')}</Text>
        </View>
        <Text style={styles.title}>5. ANALISIS PENGGUNA</Text>

        <Text style={styles.sectionTitle}>5.1 Statistik Pengguna</Text>

        <View style={styles.twoColumnLayout}>
          <View style={styles.leftColumn}>
            <Text style={styles.subsectionTitle}>Statistik Utama</Text>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Total Users:</Text>
              <Text style={styles.metricValue}>{userAnalytics.totalUsers}</Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Active Users:</Text>
              <Text style={styles.metricValue}>{userAnalytics.activeUsers}</Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>New Users This Month:</Text>
              <Text style={styles.metricValue}>{userAnalytics.newUsersThisMonth}</Text>
            </View>
            <View style={styles.metricContainer}>
              <Text style={styles.metricLabel}>Avg Booking per User:</Text>
              <Text style={styles.metricValue}>
                {(userAnalytics.activeUsers || 0) > 0
                  ? (bookings.filter(b => b.status === 'approved' || b.status === 'completed').length / (userAnalytics.activeUsers || 1)).toFixed(1)
                  : '0'
                }
              </Text>
            </View>
          </View>
          
          <View style={styles.rightColumn}>
            <Text style={styles.subsectionTitle}>Registered Institutions</Text>
            <Text style={styles.text}>
              Total institusi terdaftar: {userAnalytics.topInstitutions.length || 0}
            </Text>
            <Text style={styles.text}>
              Institution paling aktif: {userAnalytics.topInstitutions[0]?.name || 'N/A'}
            </Text>
            <Text style={styles.text}>
              Rata-rata users per institution: {
                userAnalytics.topInstitutions.length > 0
                  ? (userAnalytics.topInstitutions.reduce((sum, inst) => sum + (inst.userCount || 0), 0) / userAnalytics.topInstitutions.length).toFixed(1)
                  : '0'
              }
            </Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>
          {isShortRange ? 'Tren Registrasi Harian' : 'Tren Registrasi Bulanan'}
        </Text>
        {userAnalytics.userRegistrationTrend.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Periode</Text>
              <Text style={styles.tableCell}>Total Registrasi</Text>
              <Text style={styles.tableCell}>With Bookings</Text>
              <Text style={styles.tableCell}>Conversion Rate</Text>
            </View>
            {userAnalytics.userRegistrationTrend.slice(0, 12).map(trend => (
              <View key={trend.period} style={styles.tableRow}>
                <Text style={styles.tableCell}>{trend.period}</Text>
                <Text style={styles.tableCell}>{trend.total || 0}</Text>
                <Text style={styles.tableCell}>{trend.approved || 0}</Text>
                <Text style={styles.tableCell}>
                  {trend.total > 0 ? ((trend.approved / trend.total) * 100).toFixed(1) : '0'}%
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.text}>No user registration trend data available</Text>
        )}

        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: '#1e40af', fontFamily: 'Times-Roman' }}>
            Generated: {format(exportDate, 'dd/MM/yyyy HH:mm', { locale: id })} | Version 1.0.0
          </Text>
          <Text style={styles.pageNumber}>Page {9}</Text>
        </View>
      </Page>

      {/* Top Institutions */}
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>PERPUSTAKAAN ACEH</Text>

        <View style={styles.header}>
          <Image
            src="/logo.svg"
            style={{ width: 30, height: 30, marginRight: 10 }}
          />
          <Text>Library Analytics Report</Text>
          <Text>{format(exportDate, 'dd/MM/yyyy')}</Text>
        </View>
        <Text style={styles.sectionTitle}>5.2 Top Institutions</Text>

        <Text style={styles.subsectionTitle}>Institution Ranking by Activity</Text>
        {userAnalytics.topInstitutions.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>Institution</Text>
              <Text style={styles.tableCell}>Users</Text>
              <Text style={styles.tableCell}>Total Bookings</Text>
              <Text style={styles.tableCell}>Approved</Text>
              <Text style={styles.tableCell}>Avg per User</Text>
            </View>
            {userAnalytics.topInstitutions.slice(0, 12).map(institution => (
              <View key={institution.name} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{institution.name || 'N/A'}</Text>
                <Text style={styles.tableCell}>{institution.userCount || 0}</Text>
                <Text style={styles.tableCell}>{institution.bookingCount || 0}</Text>
                <Text style={styles.tableCell}>{institution.approvedBookingCount || 0}</Text>
                <Text style={styles.tableCell}>
                  {institution.userCount > 0
                    ? (institution.bookingCount / institution.userCount).toFixed(1)
                    : '0'
                  }
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.text}>No institution data available</Text>
        )}

        <Text style={styles.subsectionTitle}>Booking Distribution Analysis</Text>
        {userAnalytics.bookingDistribution.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Booking Range</Text>
              <Text style={styles.tableCell}>User Count</Text>
              <Text style={styles.tableCell}>Percentage</Text>
            </View>
            {userAnalytics.bookingDistribution.slice(0, 12).map(dist => (
              <View key={dist.range} style={styles.tableRow}>
                <Text style={styles.tableCell}>{dist.range || 'N/A'}</Text>
                <Text style={styles.tableCell}>{dist.count || 0}</Text>
                <Text style={styles.tableCell}>{dist.percentage || 0}%</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.text}>No booking distribution data available</Text>
        )}

        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: '#1e40af', fontFamily: 'Times-Roman' }}>
            Generated: {format(exportDate, 'dd/MM/yyyy HH:mm', { locale: id })} | Version 1.0.0
          </Text>
          <Text style={styles.pageNumber}>Page {10}</Text>
        </View>
      </Page>

      {/* Top Users */}
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>PERPUSTAKAAN ACEH</Text>

        <View style={styles.header}>
          <Image
            src="/logo.svg"
            style={{ width: 30, height: 30, marginRight: 10 }}
          />
          <Text>Library Analytics Report</Text>
          <Text>{format(exportDate, 'dd/MM/yyyy')}</Text>
        </View>
        <Text style={styles.sectionTitle}>5.3 Top Users</Text>

        <Text style={styles.subsectionTitle}>Most Active Users</Text>
        {userAnalytics.topUsers.length > 0 ? (
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>Name</Text>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>Email</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>Institution</Text>
              <Text style={styles.tableCell}>Bookings</Text>
              <Text style={styles.tableCell}>Approved</Text>
              <Text style={styles.tableCell}>Avg Guests</Text>
            </View>
            {userAnalytics.topUsers.slice(0, 12).map(user => {
              const userBookings = bookings.filter(b => b.user_id === user.id);
              const avgGuests = userBookings.length > 0
                ? (userBookings.reduce((sum, b) => sum + (b.guest_count || 0), 0) / userBookings.length).toFixed(1)
                : '0';

              return (
                <View key={user.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1.2, fontSize: 8 }]}>{user.name || 'N/A'}</Text>
                  <Text style={[styles.tableCell, { flex: 1.2, fontSize: 8 }]}>{user.email || 'N/A'}</Text>
                  <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>{user.institution || 'N/A'}</Text>
                  <Text style={styles.tableCell}>{user.bookingCount || 0}</Text>
                  <Text style={styles.tableCell}>{user.approvedBookingCount || 0}</Text>
                  <Text style={styles.tableCell}>{avgGuests}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.text}>No user data available</Text>
        )}

        <Text style={styles.subsectionTitle}>Summary & Conclusions</Text>
        <Text style={styles.text}>
          Berdasarkan analisis comprehensive data library Aceh, ditemukan beberapa insight penting:
        </Text>
        <Text style={styles.text}>
          • Tingkat persetujuan reservasi: {
            bookings.filter(b => b.status !== 'cancelled').length > 0
              ? ((bookings.filter(b => b.status === 'approved' || b.status === 'completed').length / bookings.filter(b => b.status !== 'cancelled').length) * 100).toFixed(1)
              : '0'
          }%
        </Text>
        <Text style={styles.text}>
          • Ruangan paling populer: {rooms[0]?.name || 'N/A'}
        </Text>
        <Text style={styles.text}>
          • Institution paling aktif: {userAnalytics.topInstitutions[0]?.name || 'N/A'}
        </Text>
        <Text style={styles.text}>
          • Peak hour keseluruhan: {peakHours[0]?.hour || 'N/A'}
        </Text>
        <Text style={styles.text}>
          • Total layanan yang diberikan: {bookings.filter(b => b.status !== 'cancelled').length} reservasi untuk {bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.guest_count || 0), 0)} orang
        </Text>

        {/* Summary Box for User Analysis */}
        <View style={[styles.statBox, { marginTop: 20, backgroundColor: '#e0e7ff', borderColor: '#6366f1' }]}>
          <Text style={[styles.text, { fontSize: 12, fontWeight: 'bold', color: '#312e81', textAlign: 'center' }]}>
            Key Insights - User Analysis
          </Text>
          <Text style={[styles.text, { fontSize: 10, color: '#312e81', marginTop: 5 }]}>
            • Total registered users: {userAnalytics.totalUsers || 0}
          </Text>
          <Text style={[styles.text, { fontSize: 10, color: '#312e81' }]}>
            • Active users: {userAnalytics.activeUsers || 0}
          </Text>
          <Text style={[styles.text, { fontSize: 10, color: '#312e81' }]}>
            • Most active institution: {userAnalytics.topInstitutions[0]?.name || 'N/A'} with {userAnalytics.topInstitutions[0]?.userCount || 0} users
          </Text>
        </View>

        <View style={{ marginTop: 20, padding: 15, backgroundColor: '#f0f9ff', borderRadius: 6 }}>
          <Text style={{ fontSize: 10, color: '#0c4a6e', textAlign: 'center', fontWeight: 'bold' }}>
            Laporan ini dihasilkan secara otomatis pada {format(exportDate, 'dd MMMM yyyy HH:mm', { locale: id })}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={{ fontSize: 8, color: '#1e40af', fontFamily: 'Times-Roman' }}>
            Generated: {format(exportDate, 'dd/MM/yyyy HH:mm', { locale: id })} | Version 1.0.0
          </Text>
          <Text style={styles.pageNumber}>Page {11}</Text>
        </View>
      </Page>
    </Document>
  );
};
