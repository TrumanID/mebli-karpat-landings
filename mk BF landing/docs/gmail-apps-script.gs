/**
 * Приймає заявку з сайту Black Friday і надсилає її листом на Gmail власника скрипта.
 * Інструкція: docs/gmail-setup.uk.md
 *
 * Властивості скрипта (Project Settings -> Script properties):
 *   SECRET     обов'язково: довгий випадковий рядок, такий самий, як ORDER_WEBHOOK_SECRET на сайті
 *   RECIPIENT  необов'язково: інша адреса отримувача (за замовчуванням ваш Gmail)
 */
function doPost(e) {
  try {
    var props = PropertiesService.getScriptProperties();
    var data = JSON.parse(e.postData.contents);
    var secret = props.getProperty('SECRET');
    if (!secret || data.secret !== secret) return reply_({ ok: false, error: 'forbidden' });

    var to = props.getProperty('RECIPIENT') || Session.getEffectiveUser().getEmail();
    var subject = String(data.subject || 'Заявка Black Friday').replace(/[\r\n]+/g, ' ').slice(0, 200);
    var body = String(data.text || '').slice(0, 20000);
    var options = { name: 'Сайт Black Friday' };
    if (data.replyTo && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(data.replyTo))) options.replyTo = String(data.replyTo);

    MailApp.sendEmail(to, subject, body, options);
    return reply_({ ok: true });
  } catch (err) {
    console.error(err && err.message);
    return reply_({ ok: false, error: 'error' });
  }
}

/** Запустіть один раз вручну: Google попросить дозвіл на надсилання пошти, і прийде тестовий лист. */
function testMail() {
  var to = PropertiesService.getScriptProperties().getProperty('RECIPIENT') || Session.getEffectiveUser().getEmail();
  MailApp.sendEmail(to, 'Тест: заявки Black Friday', 'Якщо ви бачите цей лист, скрипт може надсилати пошту.');
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
