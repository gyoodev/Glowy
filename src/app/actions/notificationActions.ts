
'use server';

interface ReviewReminderDetails {
  salonName: string;
  serviceName?: string;
  bookingDate: string;
  bookingTime: string;
  // In a real app, you'd also pass userId or userEmail
}

export async function sendReviewReminderEmail(details: ReviewReminderDetails): Promise<{ success: boolean; message: string }> {
  const logMessage = `Изпращане на имейл за напомняне за отзив до потребителя за резервацията му в '${details.salonName}' за услуга '${details.serviceName || 'неуточнена'}' на ${details.bookingDate} в ${details.bookingTime}.`;
  console.log(logMessage);
  
  // In a real application, this is where you'd integrate with an email service (e.g., SendGrid, Nodemailer)
  // For example:
  // try {
  //   const userEmail = "user@example.com"; // This would need to be fetched or passed
  //   await emailService.send({
  //     to: userEmail,
  //     subject: `Как беше вашето преживяване в ${details.salonName}?`,
  //     body: `Здравейте, надяваме се, че сте се насладили на ${details.serviceName || 'услугата'} в ${details.salonName} на ${details.bookingDate}. Моля, отделете малко време, за да оставите отзив!`
  //   });
  //   return { success: true, message: "Напомнянето за отзив е изпратено." };
  // } catch (error) {
  //   console.error("Грешка при изпращане на имейл за напомняне за отзив:", error);
  //   return { success: false, message: "Неуспешно изпращане на напомняне за отзив." };
  // }

  // For simulation purposes (though the message is now generic):
  return { success: true, message: "Напомнянето за отзив е изпратено." };
}

