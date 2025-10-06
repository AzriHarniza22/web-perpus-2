import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Booking, Room, Tour, Profile } from '@/lib/types';

// Create styles
const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    lineHeight: 1.5,
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1 solid #d1d5db',
    paddingBottom: 10,
    fontSize: 10,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderTop: '1 solid #d1d5db',
    paddingTop: 10,
    fontSize: 10,
    color: '#6b7280',
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 25,
    marginBottom: 15,
    color: '#1f2937',
    borderBottom: '2 solid #3b82f6',
    paddingBottom: 8,
    fontFamily: 'Times-Bold',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8,
    color: '#374151',
    fontFamily: 'Times-Bold',
  },
  text: {
    marginBottom: 5,
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  table: {
    marginVertical: 15,
    border: '1 solid #e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #e5e7eb',
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
    fontFamily: 'Times-Bold',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 6,
  },
  metricContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 4,
    borderBottom: '0.5 solid #f3f4f6',
  },
  metricLabel: {
    fontWeight: 'bold',
    color: '#374151',
    fontFamily: 'Times-Bold',
  },
  metricValue: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontFamily: 'Times-Bold',
  },
  coverPage: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: 50,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#1f2937',
    fontFamily: 'Times-Bold',
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 16,
    marginBottom: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontFamily: 'Times-Roman',
  },
  coverInfo: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 40,
    textAlign: 'center',
    fontFamily: 'Times-Roman',
  },
  tocPage: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 50,
  },
  tocTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#1f2937',
    fontFamily: 'Times-Bold',
  },
  tocItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
    borderBottom: '0.5 solid #f3f4f6',
  },
  tocText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'Times-Roman',
  },
  tocPageNum: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'Times-Roman',
  },
});

interface AnalyticsReportPDFProps {
  bookings: Booking[];
  rooms: Room[];
  tours: Tour[];
  users: Profile[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  exportDate: Date;
  userName: string;
}

export const AnalyticsReportPDF: React.FC<AnalyticsReportPDFProps> = ({
  bookings,
  rooms,
  tours,
  users,
  dateRange,
  exportDate,
  userName,
}) => {
  // Create lookup maps for efficient data access
  const userMap = new Map(users.map(u => [u.id, u]));
  const roomMap = new Map(rooms.map(r => [r.id, r]));
  const tourMap = new Map(tours.map(t => [t.id, t]));

  // Calculate metrics
  const totalBookings = bookings.length;
  const approvedBookings = bookings.filter(b => b.status === 'approved' || b.status === 'completed').length;
  const approvedRate = totalBookings > 0 ? ((approvedBookings / totalBookings) * 100).toFixed(1) : '0';

  const totalGuests = bookings.reduce((sum, b) => sum + (b.guest_count || 1), 0);
  const tourBookings = bookings.filter(b => b.room_id && tours.some(t => t.id === b.room_id)).length;
  const avgDuration = bookings.length > 0
    ? (bookings.reduce((sum, b) => {
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);
        return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0) / bookings.length).toFixed(2)
    : '0';

  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const completionRate = totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : '0';

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverPage}>
          <Text style={styles.coverTitle}>LIBRARY ANALYTICS SUMMARY REPORT</Text>
          <Text style={styles.coverSubtitle}>
            Comprehensive Analysis of Library Operations
          </Text>
          {dateRange && (
            <Text style={styles.coverSubtitle}>
              Period: {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
            </Text>
          )}
          <Text style={styles.coverInfo}>
            Export Date: {exportDate.toLocaleDateString()} {exportDate.toLocaleTimeString()}
          </Text>
          <Text style={styles.coverInfo}>
            Generated by: {userName}
          </Text>
        </View>
      </Page>

      {/* Table of Contents */}
      <Page size="A4" style={styles.tocPage}>
        <View style={styles.header}>
          <Text>Library Analytics Report</Text>
          <Text>{exportDate.toLocaleDateString()}</Text>
        </View>
        <Text style={styles.tocTitle}>Table of Contents</Text>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>1. General Overview</Text>
          <Text style={styles.tocPageNum}>3</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>   1.1 Detailed Bookings Data</Text>
          <Text style={styles.tocPageNum}>4</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>2. Room Utilization Analysis</Text>
          <Text style={styles.tocPageNum}>5</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>   2.1 Detailed Rooms Data</Text>
          <Text style={styles.tocPageNum}>6</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>3. Tour Participation Analysis</Text>
          <Text style={styles.tocPageNum}>7</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>   3.1 Detailed Tours Data</Text>
          <Text style={styles.tocPageNum}>8</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>4. User Engagement Analysis</Text>
          <Text style={styles.tocPageNum}>9</Text>
        </View>
        <View style={styles.tocItem}>
          <Text style={styles.tocText}>   4.1 Detailed Users Data</Text>
          <Text style={styles.tocPageNum}>10</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.pageNumber}>Page 2</Text>
        </View>
      </Page>

      {/* General Overview */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>Library Analytics Report</Text>
          <Text>{exportDate.toLocaleDateString()}</Text>
        </View>
        <Text style={styles.title}>LIBRARY ANALYTICS SUMMARY REPORT</Text>

        <Text style={styles.sectionTitle}>1. GENERAL OVERVIEW</Text>

        <Text style={styles.subsectionTitle}>Executive Summary</Text>
        <Text style={styles.text}>
          This report provides a comprehensive analysis of library operations including room bookings,
          tour participation, and user engagement metrics. The data presented here offers valuable
          insights into operational efficiency, resource utilization, and user behavior patterns.
        </Text>

        <Text style={styles.subsectionTitle}>Key Performance Metrics</Text>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>Total Bookings:</Text>
          <Text style={styles.metricValue}>{totalBookings}</Text>
        </View>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>Approval Rate:</Text>
          <Text style={styles.metricValue}>{approvedRate}%</Text>
        </View>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>Total Guests Served:</Text>
          <Text style={styles.metricValue}>{totalGuests} people</Text>
        </View>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>Tour Bookings:</Text>
          <Text style={styles.metricValue}>{tourBookings} ({totalBookings > 0 ? ((tourBookings / totalBookings) * 100).toFixed(1) : 0}% of total)</Text>
        </View>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>Average Duration:</Text>
          <Text style={styles.metricValue}>{avgDuration} hours</Text>
        </View>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>Completion Rate:</Text>
          <Text style={styles.metricValue}>{completionRate}%</Text>
        </View>

        <Text style={styles.subsectionTitle}>Booking Status Distribution</Text>
        <Text style={styles.text}>
          The following table illustrates the distribution of booking statuses across the reporting period,
          providing insight into the approval process and booking lifecycle.
        </Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Status</Text>
            <Text style={styles.tableCell}>Count</Text>
            <Text style={styles.tableCell}>Percentage</Text>
          </View>
          {['approved', 'pending', 'completed', 'rejected', 'cancelled'].map(status => {
            const count = bookings.filter(b => b.status === status).length;
            const percentage = totalBookings > 0 ? ((count / totalBookings) * 100).toFixed(1) : '0';
            return (
              <View key={status} style={styles.tableRow}>
                <Text style={styles.tableCell}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
                <Text style={styles.tableCell}>{count}</Text>
                <Text style={styles.tableCell}>{percentage}%</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.footer}>
          <Text style={styles.pageNumber}>Page 3</Text>
        </View>
      </Page>

      {/* Detailed Bookings Data */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>Library Analytics Report</Text>
          <Text>{exportDate.toLocaleDateString()}</Text>
        </View>
        <Text style={styles.sectionTitle}>1.1 DETAILED BOOKINGS DATA</Text>

        <Text style={styles.subsectionTitle}>Complete Bookings Information</Text>
        <Text style={styles.text}>
          This table provides a comprehensive view of all bookings within the selected period,
          including detailed information about each reservation.
        </Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { flex: 0.8 }]}>ID</Text>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>User</Text>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>Room</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>Start Time</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>End Time</Text>
            <Text style={[styles.tableCell, { flex: 0.8 }]}>Status</Text>
            <Text style={[styles.tableCell, { flex: 0.6 }]}>Guests</Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>Description</Text>
            <Text style={[styles.tableCell, { flex: 0.6 }]}>Tour</Text>
          </View>
          {bookings.map(booking => {
            const user = userMap.get(booking.user_id);
            const room = roomMap.get(booking.room_id);
            return (
              <View key={booking.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.8, fontSize: 9 }]}>{booking.id.slice(-8)}</Text>
                <Text style={[styles.tableCell, { flex: 1.2, fontSize: 9 }]}>
                  {user ? user.full_name || user.email : 'Unknown'}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.2, fontSize: 9 }]}>
                  {room ? room.name : 'Unknown'}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 9 }]}>
                  {new Date(booking.start_time).toLocaleString()}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 9 }]}>
                  {new Date(booking.end_time).toLocaleString()}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.8, fontSize: 9 }]}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.6, fontSize: 9 }]}>
                  {booking.guest_count || 1}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.5, fontSize: 9 }]}>
                  {booking.event_description || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.6, fontSize: 9 }]}>
                  {booking.is_tour ? 'Yes' : 'No'}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.footer}>
          <Text style={styles.pageNumber}>Page 4</Text>
        </View>
      </Page>

      {/* Room Utilization Analysis */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>Library Analytics Report</Text>
          <Text>{exportDate.toLocaleDateString()}</Text>
        </View>
        <Text style={styles.sectionTitle}>2. ROOM UTILIZATION ANALYSIS</Text>

        <Text style={styles.subsectionTitle}>Room Performance Summary</Text>
        <Text style={styles.text}>
          This section analyzes the utilization of library rooms, highlighting booking frequency,
          capacity usage, and overall efficiency of space allocation.
        </Text>
        {rooms.map(room => {
          const roomBookings = bookings.filter(b => b.room_id === room.id);
          const utilization = roomBookings.length > 0 ? ((roomBookings.length / totalBookings) * 100).toFixed(1) : '0';
          const avgGuests = roomBookings.length > 0
            ? (roomBookings.reduce((sum, b) => sum + (b.guest_count || 1), 0) / roomBookings.length).toFixed(1)
            : '0';

          return (
            <View key={room.id} style={{ marginBottom: 12 }}>
              <Text style={[styles.text, { fontWeight: 'bold' }]}>{room.name}</Text>
              <Text style={[styles.text, { marginLeft: 15, fontSize: 10 }]}>
                Facilities: {room.facilities?.join(', ') || 'None specified'}
              </Text>
              <Text style={[styles.text, { marginLeft: 15 }]}>
                Utilization: {utilization}% • Bookings: {roomBookings.length} • Average Guests: {avgGuests}
              </Text>
            </View>
          );
        })}
        <View style={styles.footer}>
          <Text style={styles.pageNumber}>Page 5</Text>
        </View>
      </Page>

      {/* Detailed Rooms Data */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>Library Analytics Report</Text>
          <Text>{exportDate.toLocaleDateString()}</Text>
        </View>
        <Text style={styles.sectionTitle}>2.1 DETAILED ROOMS DATA</Text>

        <Text style={styles.subsectionTitle}>Complete Rooms Information</Text>
        <Text style={styles.text}>
          This table provides detailed information about all library rooms, including their specifications
          and utilization metrics.
        </Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { flex: 1 }]}>Name</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>Description</Text>
            <Text style={[styles.tableCell, { flex: 0.6 }]}>Capacity</Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>Facilities</Text>
            <Text style={[styles.tableCell, { flex: 0.6 }]}>Active</Text>
            <Text style={[styles.tableCell, { flex: 0.6 }]}>Bookings</Text>
            <Text style={[styles.tableCell, { flex: 0.7 }]}>Utilization</Text>
            <Text style={[styles.tableCell, { flex: 0.8 }]}>Avg Guests</Text>
          </View>
          {rooms.map(room => {
            const roomBookings = bookings.filter(b => b.room_id === room.id);
            const utilization = roomBookings.length > 0 ? ((roomBookings.length / totalBookings) * 100).toFixed(1) : '0';
            const avgGuests = roomBookings.length > 0
              ? (roomBookings.reduce((sum, b) => sum + (b.guest_count || 1), 0) / roomBookings.length).toFixed(1)
              : '0';
            return (
              <View key={room.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 9 }]}>{room.name}</Text>
                <Text style={[styles.tableCell, { flex: 2, fontSize: 9 }]}>
                  {room.description || 'No description'}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.6, fontSize: 9 }]}>{room.capacity}</Text>
                <Text style={[styles.tableCell, { flex: 1.5, fontSize: 9 }]}>
                  {room.facilities?.join(', ') || 'None'}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.6, fontSize: 9 }]}>
                  {room.is_active ? 'Yes' : 'No'}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.6, fontSize: 9 }]}>{roomBookings.length}</Text>
                <Text style={[styles.tableCell, { flex: 0.7, fontSize: 9 }]}>{utilization}%</Text>
                <Text style={[styles.tableCell, { flex: 0.8, fontSize: 9 }]}>{avgGuests}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.footer}>
          <Text style={styles.pageNumber}>Page 6</Text>
        </View>
      </Page>

      {/* Tour Participation Analysis */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>Library Analytics Report</Text>
          <Text>{exportDate.toLocaleDateString()}</Text>
        </View>
        <Text style={styles.sectionTitle}>3. TOUR PARTICIPATION ANALYSIS</Text>

        <Text style={styles.subsectionTitle}>Tour Performance Summary</Text>
        <Text style={styles.text}>
          Library tours play a crucial role in community engagement and education.
          This analysis examines tour participation trends and success metrics.
        </Text>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>Total Tours Conducted:</Text>
          <Text style={styles.metricValue}>{tourBookings}</Text>
        </View>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>Total Participants:</Text>
          <Text style={styles.metricValue}>
            {bookings.filter(b => b.room_id && tours.some(t => t.id === b.room_id))
              .reduce((sum, b) => sum + (b.guest_count || 1), 0)} people
          </Text>
        </View>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>Average Participants per Tour:</Text>
          <Text style={styles.metricValue}>
            {tourBookings > 0
              ? (bookings.filter(b => b.room_id && tours.some(t => t.id === b.room_id))
                  .reduce((sum, b) => sum + (b.guest_count || 1), 0) / tourBookings).toFixed(1)
              : '0'} participants
          </Text>
        </View>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>Tour Completion Rate:</Text>
          <Text style={styles.metricValue}>
            {tourBookings > 0 ? ((completedBookings / tourBookings) * 100).toFixed(1) : '0'}%
          </Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.pageNumber}>Page 7</Text>
        </View>
      </Page>

      {/* Detailed Tours Data */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>Library Analytics Report</Text>
          <Text>{exportDate.toLocaleDateString()}</Text>
        </View>
        <Text style={styles.sectionTitle}>3.1 DETAILED TOURS DATA</Text>

        <Text style={styles.subsectionTitle}>Complete Tours Information</Text>
        <Text style={styles.text}>
          This table provides detailed information about all library tours, including their specifications
          and participation metrics.
        </Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { flex: 1 }]}>Name</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>Description</Text>
            <Text style={[styles.tableCell, { flex: 0.6 }]}>Capacity</Text>
            <Text style={[styles.tableCell, { flex: 0.8 }]}>Duration (min)</Text>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>Meeting Point</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>Guide</Text>
            <Text style={[styles.tableCell, { flex: 0.6 }]}>Active</Text>
            <Text style={[styles.tableCell, { flex: 0.6 }]}>Bookings</Text>
            <Text style={[styles.tableCell, { flex: 0.8 }]}>Avg Participants</Text>
          </View>
          {tours.map(tour => {
            const tourBookings = bookings.filter(b => b.room_id === tour.id && b.is_tour);
            const avgParticipants = tourBookings.length > 0
              ? (tourBookings.reduce((sum, b) => sum + (b.guest_count || 1), 0) / tourBookings.length).toFixed(1)
              : '0';
            return (
              <View key={tour.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 9 }]}>{tour.name}</Text>
                <Text style={[styles.tableCell, { flex: 2, fontSize: 9 }]}>
                  {tour.description || 'No description'}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.6, fontSize: 9 }]}>{tour.capacity}</Text>
                <Text style={[styles.tableCell, { flex: 0.8, fontSize: 9 }]}>
                  {tour.duration_minutes || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.2, fontSize: 9 }]}>
                  {tour.meeting_point || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 9 }]}>
                  {tour.guide_name || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.6, fontSize: 9 }]}>
                  {tour.is_active ? 'Yes' : 'No'}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.6, fontSize: 9 }]}>{tourBookings.length}</Text>
                <Text style={[styles.tableCell, { flex: 0.8, fontSize: 9 }]}>{avgParticipants}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.footer}>
          <Text style={styles.pageNumber}>Page 8</Text>
        </View>
      </Page>

      {/* User Engagement Analysis */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>Library Analytics Report</Text>
          <Text>{exportDate.toLocaleDateString()}</Text>
        </View>
        <Text style={styles.sectionTitle}>4. USER ENGAGEMENT ANALYSIS</Text>

        <Text style={styles.subsectionTitle}>User Activity Summary</Text>
        <Text style={styles.text}>
          Understanding user engagement is essential for optimizing library services.
          The following metrics provide insights into user behavior and participation levels.
        </Text>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>Active Users:</Text>
          <Text style={styles.metricValue}>{users.filter(u => u.role === 'user').length}</Text>
        </View>
        <View style={styles.metricContainer}>
          <Text style={styles.metricLabel}>Average Bookings per User:</Text>
          <Text style={styles.metricValue}>
            {users.filter(u => u.role === 'user').length > 0
              ? (totalBookings / users.filter(u => u.role === 'user').length).toFixed(1)
              : '0'}
          </Text>
        </View>

        <Text style={styles.subsectionTitle}>Top Institutions by Activity</Text>
        <Text style={styles.text}>
          This table ranks institutions by their level of engagement with library services,
          measured by user count and booking frequency.
        </Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Institution</Text>
            <Text style={styles.tableCell}>Users</Text>
            <Text style={styles.tableCell}>Bookings</Text>
            <Text style={styles.tableCell}>Avg per User</Text>
          </View>
          {/* Group users by institution and calculate metrics */}
          {Object.entries(
            users.reduce((acc, user) => {
              const institution = user.institution || 'Unknown';
              if (!acc[institution]) {
                acc[institution] = { users: [], bookings: 0 };
              }
              acc[institution].users.push(user);
              acc[institution].bookings += bookings.filter(b => b.user_id === user.id).length;
              return acc;
            }, {} as Record<string, { users: Profile[], bookings: number }>)
          )
            .sort(([, a], [, b]) => b.bookings - a.bookings)
            .slice(0, 5)
            .map(([institution, data]) => (
              <View key={institution} style={styles.tableRow}>
                <Text style={styles.tableCell}>{institution}</Text>
                <Text style={styles.tableCell}>{data.users.length}</Text>
                <Text style={styles.tableCell}>{data.bookings}</Text>
                <Text style={styles.tableCell}>
                  {data.users.length > 0 ? (data.bookings / data.users.length).toFixed(1) : '0'}
                </Text>
              </View>
            ))}
        </View>
        <View style={styles.footer}>
          <Text style={styles.pageNumber}>Page 9</Text>
        </View>
      </Page>

      {/* Detailed Users Data */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text>Library Analytics Report</Text>
          <Text>{exportDate.toLocaleDateString()}</Text>
        </View>
        <Text style={styles.sectionTitle}>4.1 DETAILED USERS DATA</Text>

        <Text style={styles.subsectionTitle}>Complete Users Information</Text>
        <Text style={styles.text}>
          This table provides detailed information about all registered users, including their profiles
          and engagement metrics.
        </Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { flex: 1 }]}>Name</Text>
            <Text style={[styles.tableCell, { flex: 1.2 }]}>Email</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>Institution</Text>
            <Text style={[styles.tableCell, { flex: 0.8 }]}>Phone</Text>
            <Text style={[styles.tableCell, { flex: 0.6 }]}>Role</Text>
            <Text style={[styles.tableCell, { flex: 0.8 }]}>Registered</Text>
            <Text style={[styles.tableCell, { flex: 0.6 }]}>Bookings</Text>
            <Text style={[styles.tableCell, { flex: 0.8 }]}>Avg Guests</Text>
          </View>
          {users.map(user => {
            const userBookings = bookings.filter(b => b.user_id === user.id);
            const avgGuests = userBookings.length > 0
              ? (userBookings.reduce((sum, b) => sum + (b.guest_count || 1), 0) / userBookings.length).toFixed(1)
              : '0';
            return (
              <View key={user.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 9 }]}>
                  {user.full_name || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, { flex: 1.2, fontSize: 9 }]}>{user.email}</Text>
                <Text style={[styles.tableCell, { flex: 1, fontSize: 9 }]}>
                  {user.institution || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.8, fontSize: 9 }]}>
                  {user.phone || 'N/A'}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.6, fontSize: 9 }]}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.8, fontSize: 9 }]}>
                  {new Date(user.created_at).toLocaleDateString()}
                </Text>
                <Text style={[styles.tableCell, { flex: 0.6, fontSize: 9 }]}>{userBookings.length}</Text>
                <Text style={[styles.tableCell, { flex: 0.8, fontSize: 9 }]}>{avgGuests}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.footer}>
          <Text style={styles.pageNumber}>Page 10</Text>
        </View>
      </Page>
    </Document>
  );
};