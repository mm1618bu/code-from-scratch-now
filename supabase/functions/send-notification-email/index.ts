
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
  ctAvg?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as EmailPayload;
    const { email, machineId, timestamp, alertType } = payload;
    
    // Validate input
    if (!email || !machineId || !timestamp) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending email notification to ${email} for machine ${machineId}`);
    
    // In a real implementation, you would use a service like Resend, SendGrid, or other email provider
    // For now, we'll simulate a successful email send
    
    // For demonstration, we're just logging the email content that would be sent
    let emailContent;
    
    if (alertType === 'CT_AVG_THRESHOLD') {
      // Handle CT_Avg threshold alert
      const { ctAvg } = payload;
      
      emailContent = {
        to: email,
        subject: `ALERT: Machine ${machineId} CT Average Threshold Exceeded`,
        body: `
          CT Average Alert for Machine ${machineId}
          
          The CT Average value of ${ctAvg?.toFixed(2) || 'unknown'} has exceeded the threshold of 15.0.
          Time: ${new Date(timestamp).toLocaleString()}
          
          This may indicate an overload condition that requires immediate attention.
          
          This is an automated notification.
        `
      };
    } else {
      // Handle state change notification
      const { previousState, newState } = payload;
      
      emailContent = {
        to: email,
        subject: `Machine ${machineId} State Change Notification`,
        body: `
          Machine ${machineId} has changed state:
          From: ${previousState}
          To: ${newState}
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
