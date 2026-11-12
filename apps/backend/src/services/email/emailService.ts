import nodemailer from "nodemailer";

export interface InquiryEmailPayload {
  referenceId: string;
  childName: string;
  childBirthday?: string;
  desiredStart: string;
  estTransition?: string;
  careHours: string;
  preferences?: {
    gender?: string;
    food?: string;
    pets?: string;
  };
  parentName: string;
  phone: string;
  email: string;
  note?: string;
  consentMapVisibility?: boolean;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  error?: string;
}

export interface DaycareStatusEmailPayload {
  status: "approved" | "rejected";
  daycareName: string;
  caregiverName: string;
  permitId?: string;
  registrationDate?: string;
  expirationDate?: string;
  issuingAuthority?: string;
  authorizedCapacity?: number;
  adminNotes?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initializingPromise: Promise<nodemailer.Transporter> | null = null;
  private fromEmail: string;

  constructor() {
    this.fromEmail =
      process.env.EMAIL_FROM ||
      (process.env.SMTP_USER ? `"Toddler Daycare" <${process.env.SMTP_USER}>` : "no-reply@toddlerdaycare.de");
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) return this.transporter;
    if (this.initializingPromise) return this.initializingPromise;

    this.initializingPromise = (async () => {
      const host = process.env.SMTP_HOST;
      const port = Number(process.env.SMTP_PORT) || 587;
      const secure = process.env.SMTP_SECURE === "true" || port === 465;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      this.fromEmail =
        process.env.EMAIL_FROM ||
        (user ? `"Toddler Daycare" <${user}>` : "no-reply@toddlerdaycare.de");

      if (host && user && pass) {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
        });
        console.log(`[EmailService] Configured live SMTP transporter: ${host}:${port} (secure: ${secure})`);
        return this.transporter;
      }

      // No live SMTP in environment: Automatically create an Ethereal test transporter
      try {
        console.log("[EmailService] Creating Ethereal test account for email delivery & preview...");
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`[EmailService] Connected to Ethereal SMTP test account: ${testAccount.user}`);
        return this.transporter;
      } catch (err: any) {
        console.warn("[EmailService] Failed to create Ethereal account, falling back to JSON stream:", err.message);
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: "windows",
          buffer: true,
        });
        return this.transporter;
      }
    })();

    return this.initializingPromise;
  }

  /**
   * Send notification to Caretaker about new inquiry
   */
  async sendInquiryNotificationToCaretaker(
    caretakerEmail: string,
    daycareName: string,
    inquiry: InquiryEmailPayload
  ): Promise<SendEmailResult> {
    const transporter = await this.getTransporter();
    const subject = `Neue Betreuungsanfrage für ${daycareName} [Ref: ${inquiry.referenceId}]`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background-color: #FAF7F2; border: 1px solid #E5DDD2; border-radius: 16px;">
        <div style="background-color: #A12D3A; padding: 20px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">Find Toddler Daycare</h1>
          <p style="color: #F8D8DC; margin: 4px 0 0 0; font-size: 13px;">Neue Betreuungsanfrage erhalten</p>
        </div>

        <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #E5DDD2; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F0E8DC; padding-bottom: 14px; margin-bottom: 18px;">
            <h2 style="margin: 0; font-size: 16px; color: #1E1B18;">Betreuungsanfrage für <strong>${daycareName}</strong></h2>
            <span style="background-color: #FAF7F2; border: 1px solid #D5C9B8; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; color: #A12D3A;">
              ${inquiry.referenceId}
            </span>
          </div>

          <h3 style="font-size: 13px; text-transform: uppercase; color: #7A6E62; margin: 16px 0 8px 0; letter-spacing: 0.5px;">1. Angaben zum Kind</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            <tr>
              <td style="padding: 6px 0; color: #6D6154; width: 40%;">Name des Kindes:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #1E1B18;">${inquiry.childName || "Nicht angegeben"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6D6154;">Geburtsdatum des Kindes:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #1E1B18;">${inquiry.childBirthday || "Nicht angegeben"}</td>
            </tr>
          </table>

          <h3 style="font-size: 13px; text-transform: uppercase; color: #7A6E62; margin: 16px 0 8px 0; letter-spacing: 0.5px;">2. Zeitlicher Rahmen</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            <tr>
              <td style="padding: 6px 0; color: #6D6154; width: 40%;">Gewünschter Start:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #1E1B18;">${inquiry.desiredStart}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6D6154;">Geschätzte Eingewöhnung:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #1E1B18;">${inquiry.estTransition || "Standard (2-4 Wochen)"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6D6154;">Betreuungszeiten:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #1E1B18;">${inquiry.careHours}</td>
            </tr>
          </table>

          <h3 style="font-size: 13px; text-transform: uppercase; color: #7A6E62; margin: 16px 0 8px 0; letter-spacing: 0.5px;">3. Elternpräferenzen</h3>
          <p style="margin: 4px 0 16px 0; font-size: 13px; color: #1E1B18; background-color: #FAF7F2; padding: 10px 14px; border-radius: 8px; border: 1px solid #E5DDD2;">
            Betreuer: <strong>${inquiry.preferences?.gender || "Beliebig"}</strong> &bull;
            Verpflegung: <strong>${inquiry.preferences?.food || "Beliebig"}</strong> &bull;
            Haustiere: <strong>${inquiry.preferences?.pets || "Beliebig"}</strong>
          </p>

          <h3 style="font-size: 13px; text-transform: uppercase; color: #7A6E62; margin: 16px 0 8px 0; letter-spacing: 0.5px;">4. Kontaktdaten der Eltern</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            <tr>
              <td style="padding: 6px 0; color: #6D6154; width: 40%;">Name:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #1E1B18;">${inquiry.parentName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6D6154;">Telefonnummer:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #1E1B18;"><a href="tel:${inquiry.phone}" style="color: #A12D3A; text-decoration: none;">${inquiry.phone || "Nicht angegeben"}</a></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6D6154;">E-Mail-Adresse:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #1E1B18;"><a href="mailto:${inquiry.email}" style="color: #A12D3A; text-decoration: none;">${inquiry.email}</a></td>
            </tr>
          </table>

          ${
            inquiry.note
              ? `
            <h3 style="font-size: 13px; text-transform: uppercase; color: #7A6E62; margin: 16px 0 8px 0; letter-spacing: 0.5px;">5. Persönliche Nachricht</h3>
            <div style="background-color: #FAF7F2; border-left: 3px solid #A12D3A; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #3D3328; line-height: 1.5; white-space: pre-line;">
              ${inquiry.note}
            </div>
            `
              : ""
          }
        </div>

        <div style="text-align: center; color: #7A6E62; font-size: 11px; line-height: 1.5;">
          <p style="margin: 0;">Diese E-Mail wurde automatisch über die Plattform <strong>Find Toddler Daycare</strong> gesendet.</p>
          <p style="margin: 4px 0 0 0;">Sie können den anfragenden Eltern direkt antworten, indem Sie auf diese Nachricht oder auf deren angegebene E-Mail antworten.</p>
        </div>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from: `"Toddler Daycare Platform" <${this.fromEmail}>`,
        to: caretakerEmail,
        replyTo: inquiry.email,
        subject,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[EmailService] Inquiry notification sent to caretaker (${caretakerEmail}). MessageId: ${info.messageId}`);
      if (previewUrl) {
        console.log(`[EmailService] Caretaker Email Preview URL: ${previewUrl}`);
      }

      return { success: true, messageId: info.messageId, previewUrl };
    } catch (err: any) {
      console.error(`[EmailService] Failed to send email to caretaker (${caretakerEmail}):`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send confirmation email to Parent
   */
  async sendInquiryConfirmationToParent(
    parentEmail: string,
    parentName: string,
    contactedDaycares: string[],
    inquiry: InquiryEmailPayload
  ): Promise<SendEmailResult> {
    const transporter = await this.getTransporter();
    const subject = `Bestätigung Ihrer Betreuungsanfrage [Ref: ${inquiry.referenceId}]`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background-color: #FAF7F2; border: 1px solid #E5DDD2; border-radius: 16px;">
        <!-- Header -->
        <div style="background-color: #16A34A; padding: 22px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: bold; letter-spacing: 0.5px;">Betreuungsanfrage eingereicht</h1>
          <p style="color: #DCFCE7; margin: 6px 0 0 0; font-size: 13px;">Daycare Search Inquiry Confirmation</p>
        </div>

        <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #E5DDD2; margin-bottom: 20px;">
          <p style="font-size: 15px; color: #1E1B18; margin: 0 0 12px 0;">
            Hallo <strong>${parentName}</strong>,
          </p>
          <p style="font-size: 13px; color: #4E443B; line-height: 1.6; margin: 0 0 20px 0;">
            Vielen Dank für Ihre Anfrage! Ihre Betreuungsanfrage wurde erfolgreich über unser System erfasst und an die ausgewählten Kindertagespflegen übermittelt.
          </p>

          <!-- Reference ID Badge -->
          <div style="background-color: #FAF7F2; border: 1px solid #E5DDD2; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; color: #7A6E62; text-transform: uppercase; font-weight: bold; margin-bottom: 2px;">Ihre Referenznummer / Reference ID</div>
              <div style="font-size: 20px; color: #A12D3A; font-weight: bold; letter-spacing: 0.5px;">${inquiry.referenceId}</div>
            </div>
            <div style="background-color: #DCFCE7; color: #166534; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 12px;">
              Eingereicht
            </div>
          </div>

          <!-- Contacted Daycares -->
          <h3 style="font-size: 13px; text-transform: uppercase; color: #7A6E62; margin: 18px 0 8px 0; letter-spacing: 0.5px;">Kontaktierte Kindertagespflegen (${contactedDaycares.length}):</h3>
          <ul style="margin: 0 0 20px 0; padding-left: 20px; font-size: 13px; color: #1E1B18; line-height: 1.6;">
            ${contactedDaycares.map((d) => `<li><strong>${d}</strong></li>`).join("")}
          </ul>

          <!-- Summary Table -->
          <h3 style="font-size: 13px; text-transform: uppercase; color: #7A6E62; margin: 18px 0 8px 0; letter-spacing: 0.5px;">Zusammenfassung Ihrer Anfrage:</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            <tr style="border-bottom: 1px solid #F0E8DC;">
              <td style="padding: 8px 0; color: #6D6154; width: 42%;">Name des Kindes:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1E1B18;">${inquiry.childName || "1 Kind"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0E8DC;">
              <td style="padding: 8px 0; color: #6D6154;">Geburtsdatum:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1E1B18;">${inquiry.childBirthday || "Nicht angegeben"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0E8DC;">
              <td style="padding: 8px 0; color: #6D6154;">Gewünschter Start:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1E1B18;">${inquiry.desiredStart}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0E8DC;">
              <td style="padding: 8px 0; color: #6D6154;">Geschätzte Eingewöhnung:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1E1B18;">${inquiry.estTransition || "Standard (2-4 Wochen)"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0E8DC;">
              <td style="padding: 8px 0; color: #6D6154;">Betreuungszeiten:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1E1B18;">${inquiry.careHours}</td>
            </tr>
            <tr style="border-bottom: 1px solid #F0E8DC;">
              <td style="padding: 8px 0; color: #6D6154;">Präferenzen:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1E1B18;">${inquiry.preferences?.gender || "Beliebig"} &bull; ${inquiry.preferences?.food || "Beliebig"} &bull; ${inquiry.preferences?.pets || "Beliebig"}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6D6154;">Ihre Kontaktdaten:</td>
              <td style="padding: 8px 0; font-weight: bold; color: #1E1B18;">${inquiry.parentName} (${inquiry.phone} &bull; ${inquiry.email})</td>
            </tr>
          </table>

          ${
            inquiry.note
              ? `
            <div style="margin-bottom: 16px; background-color: #FAF7F2; border-left: 3px solid #16A34A; padding: 10px 14px; border-radius: 4px; font-size: 12px; color: #3D3328;">
              <strong>Ihre Nachricht:</strong><br />${inquiry.note}
            </div>
            `
              : ""
          }

          ${
            inquiry.consentMapVisibility
              ? `
            <div style="margin-top: 18px; padding: 12px 16px; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; font-size: 12px; color: #166534; line-height: 1.5;">
              ✓ <strong>30-Tage Kartensichtbarkeit aktiv:</strong> Ihre Suchanfrage bleibt für zertifizierte Tagespflegepersonen in Ihrer Nähe 30 Tage lang sichtbar.
            </div>
            `
              : ""
          }
        </div>

        <!-- Next Steps -->
        <div style="background-color: #ffffff; padding: 18px 24px; border-radius: 12px; border: 1px solid #E5DDD2; margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #1E1B18;">Wie geht es weiter? / Next Steps:</h4>
          <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #5C5044; line-height: 1.6;">
            <li>Die Tagespflegepersonen prüfen Ihre Angaben bezüglich freier Kapazitäten.</li>
            <li>Sie werden direkt per Telefon oder E-Mail kontaktiert, um ein persönliches Kennenlerntreffen zu vereinbaren.</li>
            <li>Sie können Ihre Anfrage jederzeit über unser Support-Team verwalten.</li>
          </ol>
        </div>

        <!-- Footer -->
        <div style="text-align: center; color: #7A6E62; font-size: 11px; line-height: 1.5;">
          <p style="margin: 0;">Find Toddler Daycare GmbH &bull; Ihr Partner für vertrauensvolle Kindertagespflege</p>
          <p style="margin: 4px 0 0 0;">Bei Fragen schreiben Sie uns an: <a href="mailto:support@toddlerdaycare.de" style="color: #A12D3A;">support@toddlerdaycare.de</a></p>
        </div>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from: `"Toddler Daycare Platform" <${this.fromEmail}>`,
        to: parentEmail,
        subject,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[EmailService] Confirmation sent to parent (${parentEmail}). MessageId: ${info.messageId}`);
      if (previewUrl) {
        console.log(`================================================================================`);
        console.log(`[EmailService] PARENT CONFIRMATION EMAIL PREVIEW URL:`);
        console.log(`>> ${previewUrl}`);
        console.log(`================================================================================`);
      }

      return { success: true, messageId: info.messageId, previewUrl };
    } catch (err: any) {
      console.error(`[EmailService] Failed to send email to parent (${parentEmail}):`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Send approval or rejection notification email to Caretaker when Admin updates daycare status
   */
  async sendDaycareStatusNotificationToCaretaker(
    caretakerEmail: string,
    payload: DaycareStatusEmailPayload
  ): Promise<SendEmailResult> {
    const transporter = await this.getTransporter();
    const isApproved = payload.status === "approved";

    const subject = isApproved
      ? `Genehmigt / Approved: Ihre Kindertagespflege "${payload.daycareName}" ist freigeschaltet`
      : `Status-Update / Rejected: Ihre Kindertagespflege-Bewerbung "${payload.daycareName}"`;

    const headerBg = isApproved ? "#16A34A" : "#A12D3A";
    const headerSubBg = isApproved ? "#DCFCE7" : "#F8D8DC";
    const badgeBg = isApproved ? "#DCFCE7" : "#FEE2E2";
    const badgeText = isApproved ? "#166534" : "#991B1B";
    const statusLabel = isApproved ? "Genehmigt / Approved" : "Abgelehnt / Rejected";

    const permitRows = isApproved
      ? `
          <h3 style="font-size: 13px; text-transform: uppercase; color: #7A6E62; margin: 18px 0 8px 0; letter-spacing: 0.5px;">Verifizierte Erlaubnisdetails / Verified Permit Details</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
            ${
              payload.permitId
                ? `<tr style="border-bottom: 1px solid #F0E8DC;"><td style="padding: 8px 0; color: #6D6154; width: 42%;">Erlaubnis-ID / Permit ID:</td><td style="padding: 8px 0; font-weight: bold; color: #1E1B18;">${payload.permitId}</td></tr>`
                : ""
            }
            ${
              payload.issuingAuthority
                ? `<tr style="border-bottom: 1px solid #F0E8DC;"><td style="padding: 8px 0; color: #6D6154;">Behörde / Authority:</td><td style="padding: 8px 0; font-weight: bold; color: #1E1B18;">${payload.issuingAuthority}</td></tr>`
                : ""
            }
            ${
              payload.registrationDate
                ? `<tr style="border-bottom: 1px solid #F0E8DC;"><td style="padding: 8px 0; color: #6D6154;">Registriert am / Issued:</td><td style="padding: 8px 0; font-weight: bold; color: #1E1B18;">${payload.registrationDate}</td></tr>`
                : ""
            }
            ${
              payload.expirationDate
                ? `<tr style="border-bottom: 1px solid #F0E8DC;"><td style="padding: 8px 0; color: #6D6154;">Gültig bis / Expires:</td><td style="padding: 8px 0; font-weight: bold; color: #15803D;">${payload.expirationDate}</td></tr>`
                : ""
            }
            ${
              payload.authorizedCapacity
                ? `<tr><td style="padding: 8px 0; color: #6D6154;">Kapazität / Capacity:</td><td style="padding: 8px 0; font-weight: bold; color: #1E1B18;">${payload.authorizedCapacity} Kinder / children</td></tr>`
                : ""
            }
          </table>
        `
      : "";

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; background-color: #FAF7F2; border: 1px solid #E5DDD2; border-radius: 16px;">
        <div style="background-color: ${headerBg}; padding: 22px 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: bold; letter-spacing: 0.5px;">
            ${isApproved ? "Kindertagespflege genehmigt / Daycare Approved" : "Bewerbung abgelehnt / Daycare Rejected"}
          </h1>
          <p style="color: ${headerSubBg}; margin: 6px 0 0 0; font-size: 13px;">Find Toddler Daycare • Admin Review Update</p>
        </div>

        <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #E5DDD2; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #F0E8DC; padding-bottom: 14px; margin-bottom: 18px;">
            <h2 style="margin: 0; font-size: 16px; color: #1E1B18;">${payload.daycareName}</h2>
            <span style="background-color: ${badgeBg}; color: ${badgeText}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
              ${statusLabel}
            </span>
          </div>

          <p style="font-size: 15px; color: #1E1B18; margin: 0 0 12px 0;">
            Hallo <strong>${payload.caregiverName || "Betreuer/in"}</strong>,
          </p>

          ${
            isApproved
              ? `
                <p style="font-size: 13px; color: #4E443B; line-height: 1.6; margin: 0 0 16px 0;">
                  Herzlichen Glückwunsch! Ihre Kindertagespflege <strong>${payload.daycareName}</strong> wurde erfolgreich von unserem Administrator-Team geprüft und <strong>genehmigt</strong>.
                </p>
                <p style="font-size: 13px; color: #4E443B; line-height: 1.6; margin: 0 0 16px 0;">
                  Congratulations! Your daycare <strong>${payload.daycareName}</strong> has been verified and <strong>approved</strong>. You can now log in to your Caretaker Portal, and your daycare is live for parents.
                </p>
              `
              : `
                <p style="font-size: 13px; color: #4E443B; line-height: 1.6; margin: 0 0 16px 0;">
                  Leider wurde Ihre Kindertagespflege-Bewerbung für <strong>${payload.daycareName}</strong> bei der Überprüfung <strong>abgelehnt</strong>.
                </p>
                <p style="font-size: 13px; color: #4E443B; line-height: 1.6; margin: 0 0 16px 0;">
                  Unfortunately, your daycare application for <strong>${payload.daycareName}</strong> was <strong>rejected</strong> during admin review. You can now log in to your Caretaker Portal to update your profile or work permit and resubmit for review.
                </p>
              `
          }

          ${permitRows}

          ${
            payload.adminNotes
              ? `
                <div style="margin-top: 14px; background-color: #FAF7F2; border-left: 3px solid ${headerBg}; padding: 12px 16px; border-radius: 4px; font-size: 13px; color: #3D3328; line-height: 1.5;">
                  <strong>Hinweise / Admin Notes:</strong><br />${payload.adminNotes}
                </div>
              `
              : ""
          }
        </div>

        <div style="text-align: center; color: #7A6E62; font-size: 11px; line-height: 1.5;">
          <p style="margin: 0;">Find Toddler Daycare GmbH &bull; Ihr Partner für vertrauensvolle Kindertagespflege</p>
          <p style="margin: 4px 0 0 0;">Bei Fragen schreiben Sie uns an: <a href="mailto:support@toddlerdaycare.de" style="color: #A12D3A;">support@toddlerdaycare.de</a></p>
        </div>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from: `"Toddler Daycare Platform" <${this.fromEmail}>`,
        to: caretakerEmail,
        subject,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(
        `[EmailService] Daycare ${payload.status} notification sent to caretaker (${caretakerEmail}). MessageId: ${info.messageId}`
      );
      if (previewUrl) {
        console.log(`[EmailService] Caretaker Status Email Preview URL: ${previewUrl}`);
      }

      return { success: true, messageId: info.messageId, previewUrl };
    } catch (err: any) {
      console.error(
        `[EmailService] Failed to send daycare ${payload.status} email to caretaker (${caretakerEmail}):`,
        err.message
      );
      return { success: false, error: err.message };
    }
  }
}

export const emailService = new EmailService();
