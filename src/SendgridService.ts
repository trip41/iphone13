import config from './config';
import sgMail, { MailDataRequired } from '@sendgrid/mail';

class SendgridService {
  public static instance: SendgridService;

  public static init() {
    this.instance = new SendgridService();
    if (!config.sendgridApiKey) {
      console.error('Missing env var SENDGRID_API_KEY');
      return;
    }
    sgMail.setApiKey(config.sendgridApiKey);
  }

  public static async sendEmail(text: string) {
    const subject = 'iPhone 13 Pros available!';
    const msg: MailDataRequired = {
      to: config.email!,
      from: config.email!,
      text,
      subject: subject,
      hideWarnings: true,
    };
    return SendgridService.sendMail(msg);
  }

  public static async sendMail(msg: MailDataRequired) {
    try {
      await sgMail.send(msg);
    } catch (error: any) {
      console.error(error);

      if (error.response) {
        console.error(error.response.body);
      }
    }
  }

  private constructor() {
    SendgridService.instance = this;
  }
}

export default SendgridService;
