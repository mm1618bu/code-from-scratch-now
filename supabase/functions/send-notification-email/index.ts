
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  email: string;
  machineId: string;
  previousState: string;
  newState: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, machineId, previousState, newState, timestamp } = await req.json() as EmailPayload;
    
    // Validate input
    if (!email || !machineId || !previousState || !newState || !timestamp) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending email notification to ${email} for machine ${machineId}`);
    
    // In a real implementation, you would use a service like Resend, SendGrid, or other email provider
    // For now, we'll simulate a successful email send
    
    // For demonstration, we're just logging the email content that would be sent
    const emailContent = {
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
    
    console.log("Email content that would be sent:", emailContent);
    
    // To implement actual email sending, you would use code like this:
    /*
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const { data, error } = await resend.emails.send({
      from: "notifications@yourdomain.com",
      to: email,
      subject: `Machine ${machineId} State Change Notification`,
      html: `
        <h1>Machine State Change Notification</h1>
        <p>Machine <strong>${machineId}</strong> has changed state:</p>
        <ul>
          <li>From: <strong>${previousState}</strong></li>
          <li>To: <strong>${newState}</strong></li>
          <li>Time: ${new Date(timestamp).toLocaleString()}</li>
        </ul>
        <p>This is an automated notification.</p>
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
