package com.example.demo.util;

import com.example.demo.model.enums.Priority;

public class ComplaintAnalyzer {

    public static Priority detectPriority(String description) {

        if (description == null) return Priority.LOW;

        String desc = description.toLowerCase();

        if (desc.contains("urgent") || desc.contains("fire") || desc.contains("leak"))
            return Priority.HIGH;

        else if (desc.contains("slow") || desc.contains("not working"))
            return Priority.MEDIUM;

        else
            return Priority.LOW;
    }

    public static String detectSentiment(String description) {
        if (description == null) return "NEUTRAL";
        String desc = description.toLowerCase();
        
        if (desc.contains("angry") || desc.contains("hate") || desc.contains("frustrated") || desc.contains("terrible") || desc.contains("stupid")) {
            return "FRUSTRATED";
        } else if (desc.contains("urgent") || desc.contains("immediate") || desc.contains("fast as possible") || desc.contains("broken")) {
            return "CRITICAL";
        } else {
            return "NEUTRAL";
        }
    }

    public static String detectCategory(String description) {

        if (description == null) return "General";

        String desc = description.toLowerCase();

        if (desc.contains("wifi") || desc.contains("internet"))
            return "Technical";

        else if (desc.contains("water") || desc.contains("electricity"))
            return "Infrastructure";

        else if (desc.contains("exam") || desc.contains("marks"))
            return "Academic";

        else
            return "General";
    }

    public static String detectDepartment(String category) {

        switch (category) {
            case "Technical":
                return "IT Department";
            case "Infrastructure":
                return "Maintenance";
            case "Academic":
                return "Admin Section";
            default:
                return "General Office";
        }
    }
}