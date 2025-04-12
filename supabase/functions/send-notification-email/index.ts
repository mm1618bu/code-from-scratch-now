
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  email: string;
  machineId: string;
  previousState?: string;
  newState?: string;
  timestamp: string;
  alertType?: string;
  totalCurrent?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as EmailPayload;
    const { email, machineId, timestamp, alertType, totalCurrent } = payload;
    
    // Validate input
    if (!email || !machineId || !timestamp) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending email notification to ${email} for machine ${machineId}`);
    
    // Only process notifications if total current is over 15.0
    if (alertType === 'STATE_CHANGE' && (!totalCurrent || totalCurrent < 15.0)) {
      console.log(`Skipping notification for machine ${machineId} as total current is below threshold`);
      return new Response(
        JSON.stringify({ success: true, message: "Notification skipped due to low current" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // For demonstration, we're just logging the email content that would be sent
    let emailContent;
    
    if (alertType === 'TOTAL_CURRENT_THRESHOLD') {
      // For Total Current alerts
      console.log(`Processing Total Current alert for machine ${machineId}, value: ${totalCurrent}`);
      
      emailContent = {
        to: email,
        subject: `Machine ${machineId} Total Current Alert`,
        body: `
          Machine ${machineId} has exceeded the total current threshold:
          Current Value: ${totalCurrent}
          Time: ${new Date(timestamp).toLocaleString()}
          
          This is an automated notification.
        `
      };
    } else {
      // Handle state change notification - only if total current over threshold
      const { previousState, newState } = payload;
      
      emailContent = {
        to: email,
        subject: `Machine ${machineId} State Change Notification (High Current)`,
        body: `
          Machine ${machineId} has changed state with high current reading:
          From: ${previousState}
          To: ${newState}
          Total Current: ${totalCurrent}
          Time: ${new Date(timestamp).toLocaleString()}
          
          This is an automated notification.
        `
      };
    }
    
    console.log("Email content that would be sent:", emailContent);
    
    // To implement actual email sending, you would use code like this:
    /*
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { data, error } = await resend.emails.send({
      from: "notifications@yourdomain.com",
      to: email,
      subject: emailContent.subject,
      html: `
        <h1>${emailContent.subject}</h1>
        <p>${emailContent.body.replace(/\n/g, '<br/>')}</p>
      `,
    });
    
    if (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
    */
    
    return new Response(
      JSON.stringify({ success: true, message: "Email notification sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-notification-email function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email notification" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
