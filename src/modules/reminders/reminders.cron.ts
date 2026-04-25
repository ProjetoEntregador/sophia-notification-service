// @Cron('* * * * *')
// async handleReminders() {
//   const reminders =
//     await this.remindersRepo.findPending();

//   for (const reminder of reminders) {
//     await this.messageSender.sendMessage(
//       reminder.phone,
//       "Hora do seu medicamento"
//     );
//   }
// }
