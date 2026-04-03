package com.example.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * AI Chat Service powered by Groq (LLaMA 3.3 70B).
 * Strictly scoped to complaint management operations only.
 * Falls back to local rule-based responses if Groq is unreachable.
 */
@Service
public class ChatAiService {

    @Value("${groq.api.key:MISSING}")
    private String apiKey;

    @Value("${groq.api.url:MISSING}")
    private String apiUrl;

    @Value("${groq.model:MISSING}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String SYSTEM_PROMPT =
        "You are the senior AI Assistant for this institutional complaint management system. " +
        "Your mission is to ensure every institutional grievance is professionally captured, categorized, and resolved. " +
        "You are powered by a comprehensive institutional knowledge base.\n\n" +
        "CONTEXT & CAPABILITIES:\n" +
        "1. STORAGE: We use enterprise-grade cloud infrastructure (Aiven MySQL) for 99.9% reliability.\n" +
        "2. PROOF: Users can now ATTACH PHOTOS as proof of their issue. Encourage users to use the 'Add Photo' button in the manual form for faster resolution.\n" +
        "3. SATISFACTION: Users can now RATE RESOLUTIONS (1-5 stars). If a user asks about a closed ticket, explain that their feedback helps us improve.\n" +
        "4. SCOPE: WiFi, Electricity, Water, Sanitation, Mess, Hostel, Labs, Academics, and general facilities.\n\n" +
        "STRICT OPERATIONAL RULES:\n" +
        "- ONLY discuss complaints and institutional issues. POLITELY REJECT all other topics (coding, general chat, etc.).\n" +
        "- IDENTITY: Never mention 'Groq', 'LLaMA', or any external AI company. You are a proprietary institutional asset.\n" +
        "- TONE: Formal, authoritative, yet empathetic. No excessive emojis.\n" +
        "- SUGGESTIONS: Always provide Category, Department, and Priority when a problem is described.\n" +
        "- CALL TO ACTION: Ask if they want to register the complaint via your interface (YES/NO).";

    // Local fallback responses (Institutional Tone)
    private static final Map<String, String> FALLBACK_RESPONSES = Map.ofEntries(
        Map.entry("wifi", "Technical disruption noted. 📶 I've categorized this under 'IT Department' with MEDIUM priority. Would you like to register this formal grievance? (YES/NO)"),
        Map.entry("internet", "Network connectivity issue detected. 🌐 Department: IT | Priority: MEDIUM. Shall I log this for technician review?"),
        Map.entry("water", "Critical utility failure: Water supply. 💧 This requires immediate 'Maintenance' intervention. Priority: HIGH. Register now?"),
        Map.entry("electricity", "Power infrastructure issue. ⚡ Department: Electrical | Priority: HIGH. I recommend immediate registration for dispatch."),
        Map.entry("food", "Service quality concern: Mess/Dining. 🍽️ Department: Hostel Management | Priority: MEDIUM. Should I file this report?"),
        Map.entry("exam", "Academic grievance recognized. 📚 Department: Administration | Priority: MEDIUM. I am ready to log this for the registrar."),
        Map.entry("multimedia", "You can now attach visual proof to any complaint. Please use the 'Add Photo' feature in the submission panel for higher accuracy."),
        Map.entry("photo", "Visual evidence significantly speeds up resolution. Please include a photo using the attachment icon when prompted."),
        Map.entry("rating", "Your satisfaction is paramount. You can now rate any RESOLVED ticket on a scale of 1-5 stars.")
    );

    public String askAI(String message) {
        if (message == null || message.trim().isEmpty()) {
            return "Please describe your issue and I'll help you register it! 😊";
        }

        try {
            return callGroqAPI(message);
        } catch (Exception e) {
            // Fallback to local responses if Groq API fails
            return getLocalResponse(message);
        }
    }

    private String callGroqAPI(String message) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        // Build the request body
        Map<String, Object> systemMsg = new LinkedHashMap<>();
        systemMsg.put("role", "system");
        systemMsg.put("content", SYSTEM_PROMPT);

        Map<String, Object> userMsg = new LinkedHashMap<>();
        userMsg.put("role", "user");
        userMsg.put("content", message);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(systemMsg, userMsg));
        requestBody.put("max_tokens", 300);
        requestBody.put("temperature", 0.7);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            apiUrl, HttpMethod.POST, entity, Map.class
        );

        // Parse the response
        Map body = response.getBody();
        if (body != null && body.containsKey("choices")) {
            List<Map> choices = (List<Map>) body.get("choices");
            if (!choices.isEmpty()) {
                Map choiceMessage = (Map) choices.get(0).get("message");
                return (String) choiceMessage.get("content");
            }
        }

        throw new RuntimeException("Empty Groq response");
    }

    private String getLocalResponse(String message) {
        String lower = message.toLowerCase();

        for (Map.Entry<String, String> entry : FALLBACK_RESPONSES.entrySet()) {
            if (lower.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        if (lower.matches(".*(hello|hi|hey).*")) {
            return "Greetings! 👋 I am your AI Assistant. Describe any institutional grievance or utility failure, and I'll help you register it properly.";
        }

        return "I understand you're facing an issue. 📋 Could you provide more details like:\n• Where is the problem?\n• How severe is it?\n• When did it start?\n\nThis helps me assign it to the right department! 💪";
    }
}