
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    
    let emailSubject, emailHtml;
    
    if (alertType === 'TOTAL_CURRENT_THRESHOLD') {
      // For Total Current alerts
      console.log(`Processing Total Current alert for machine ${machineId}, value: ${totalCurrent}`);
      
      emailSubject = `Machine ${machineId} Total Current Alert`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #d9534f;">Machine ${machineId} Total Current Alert</h2>
          <p><strong>Alert Type:</strong> High Total Current</p>
          <p><strong>Current Value:</strong> ${totalCurrent?.toFixed(2)}</p>
          <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #777; font-size: 12px;">This is an automated notification from your machine monitoring system.</p>
        </div>
      `;
    } else {
      // Handle state change notification - only if total current over threshold
      const { previousState, newState } = payload;
      
      emailSubject = `Machine ${machineId} State Change Notification (High Current)`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #d9534f;">Machine ${machineId} State Change with High Current</h2>
          <p><strong>State Change:</strong> ${previousState} → ${newState}</p>
          <p><strong>Total Current:</strong> ${totalCurrent?.toFixed(2)}</p>
          <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #777; font-size: 12px;">This is an automated notification from your machine monitoring system.</p>
        </div>
      `;
    }
    
    // Send the email using Resend
    console.log("Sending email via Resend with subject:", emailSubject);
    const { data, error } = await resend.emails.send({
      from: "Machine Monitoring <onboarding@resend.dev>",
      to: email,
      subject: emailSubject,
      html: emailHtml,
    });
    
    if (error) {
      console.error("Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
    
    console.log("Email sent successfully via Resend:", data);
    
    return new Response(
      JSON.stringify({ success: true, message: "Email notification sent successfully", data }),
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
