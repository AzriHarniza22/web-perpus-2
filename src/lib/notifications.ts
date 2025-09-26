import { supabase } from './supabase'

export interface NotificationData {
  bookingId: string
  type: 'email' | 'whatsapp'
  recipient: string
  message: string
}

export async function sendNotification({ bookingId, type, recipient, message }: NotificationData) {
  try {
    // Save notification to database
    const { error } = await supabase
      .from('notifications')
      .insert({
        booking_id: bookingId,
        type,
        recipient,
        message,
      })

    if (error) throw error

    // Send actual notification
    if (type === 'email') {
      // Email sending disabled - only database storage
      console.log(`Email notification stored for ${recipient}: ${message}`)
    } else if (type === 'whatsapp') {
      // WhatsApp implementation will be added later
      console.log(`WhatsApp notification: ${recipient} - ${message}`)
    }

    console.log(`Notification sent: ${type} to ${recipient}`)

    return { success: true }
  } catch (error) {
    console.error('Error sending notification:', error)
    return { success: false, error }
  }
}

export async function sendBookingConfirmation(bookingId: string) {
  try {
    // Get booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          phone
        ),
        rooms:room_id (
          name
        )
      `)
      .eq('id', bookingId)
      .single()

    if (error || !booking) throw error

    const user = booking.profiles
    const room = booking.rooms

    // Send email notification
    const emailMessage = `
      Dear ${user.full_name},

      Your booking for ${room.name} has been submitted successfully.

      Details:
      - Date: ${new Date(booking.start_time).toLocaleDateString('id-ID')}
      - Time: ${new Date(booking.start_time).toLocaleTimeString('id-ID')} - ${new Date(booking.end_time).toLocaleTimeString('id-ID')}
      - Event: ${booking.event_description || 'N/A'}

      Status: ${booking.status}

      Please wait for approval from the library staff.

      Best regards,
      Perpustakaan Wilayah Aceh
    `

    await sendNotification({
      bookingId,
      type: 'email',
      recipient: user.email,
      message: emailMessage,
    })

    // Send WhatsApp notification if phone number is available
    if (user.phone) {
      const whatsappMessage = `Halo ${user.full_name}, booking ruangan ${room.name} Anda telah diajukan. Status: ${booking.status}. Silakan tunggu konfirmasi dari staff perpustakaan.`

      await sendNotification({
        bookingId,
        type: 'whatsapp',
        recipient: user.phone,
        message: whatsappMessage,
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending booking confirmation:', error)
    return { success: false, error }
  }
}

export async function sendBookingStatusUpdate(bookingId: string, newStatus: string) {
  try {
    // Get booking details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          phone
        ),
        rooms:room_id (
          name
        )
      `)
      .eq('id', bookingId)
      .single()

    if (error || !booking) throw error

    const user = booking.profiles
    const room = booking.rooms

    const statusText = {
      approved: 'Disetujui',
      rejected: 'Ditolak',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
    }[newStatus] || newStatus

    // Send email notification
    const emailMessage = `
      Dear ${user.full_name},

      Status booking Anda untuk ${room.name} telah diperbarui.

      Details:
      - Date: ${new Date(booking.start_time).toLocaleDateString('id-ID')}
      - Time: ${new Date(booking.start_time).toLocaleTimeString('id-ID')} - ${new Date(booking.end_time).toLocaleTimeString('id-ID')}
      - Event: ${booking.event_description || 'N/A'}

      Status Baru: ${statusText}

      Best regards,
      Perpustakaan Wilayah Aceh
    `

    await sendNotification({
      bookingId,
      type: 'email',
      recipient: user.email,
      message: emailMessage,
    })

    // Send WhatsApp notification if phone number is available
    if (user.phone) {
      const whatsappMessage = `Halo ${user.full_name}, status booking ruangan ${room.name} Anda telah diperbarui menjadi: ${statusText}.`

      await sendNotification({
        bookingId,
        type: 'whatsapp',
        recipient: user.phone,
        message: whatsappMessage,
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error sending status update notification:', error)
    return { success: false, error }
  }
}
export async function notifyAdminNewReservation(userName: string, roomName: string, adminEmail: string) {
  const message = `User ${userName} telah memesan ruangan ${roomName}. Silakan periksa dan setujui/ditolak reservasi tersebut.`

  try {
    // Save admin notification to database only
    const { error } = await supabase
      .from('notifications')
      .insert({
        booking_id: null, // No specific booking ID for admin notifications
        type: 'email',
        recipient: adminEmail,
        message,
      })

    if (error) throw error

    console.log(`Admin notification stored for ${adminEmail}: ${message}`)
    return { success: true }
  } catch (error) {
    console.error('Error storing admin notification:', error)
    return { success: false, error }
  }
}