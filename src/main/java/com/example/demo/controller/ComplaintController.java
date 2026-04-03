package com.example.demo.controller;

import com.example.demo.model.Complaint;
import com.example.demo.model.enums.Status;
import com.example.demo.service.ComplaintService;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.demo.service.AiServiceClient;
import com.example.demo.service.ChatAiService;

import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;

@RestController
@RequestMapping("/complaints")
@CrossOrigin(origins = "*")
public class ComplaintController {

    private final ComplaintService service;
    
    public ComplaintController(ComplaintService service,
            SimpMessagingTemplate messagingTemplate) {
this.service = service;
this.messagingTemplate = messagingTemplate;
}
    private final SimpMessagingTemplate messagingTemplate;
    
    @GetMapping("/all")
    public List<Complaint> allComplaints(){
        return service.getAllComplaints();
    }
    
    @PostMapping
    public Complaint create(@RequestBody Complaint complaint) {

        try {
            // Try the external AI service first
            Map<String, String> aiResult =
                    aiServiceClient.analyzeText(complaint.getDescription());

            complaint.setCategory(aiResult.get("category"));
            complaint.setDepartment(aiResult.get("department"));
            complaint.setPriority(
                    com.example.demo.model.enums.Priority
                            .valueOf(aiResult.get("priority"))
            );
        } catch (Exception e) {
            // Fallback to local NLP analyzer when AI service is unavailable
            String category = com.example.demo.util.ComplaintAnalyzer
                    .detectCategory(complaint.getDescription());
            complaint.setCategory(category);
            complaint.setDepartment(
                    com.example.demo.util.ComplaintAnalyzer.detectDepartment(category));
            complaint.setPriority(
                    com.example.demo.util.ComplaintAnalyzer.detectPriority(complaint.getDescription()));
        }

        return service.createComplaint(complaint);
    }
    
    @GetMapping("/my")
    public List<Complaint> myComplaints(@RequestParam Long userId){
        return service.getUserComplaints(userId);
    }
    
    @GetMapping
    public List<Complaint> getComplaints(
            @RequestParam(required = false) Status status,
            @RequestParam(required = false) String search
    ) {

        if (status != null) {
            return service.getByStatus(status);
        }

        if (search != null) {
            return service.searchByTitle(search);
        }

        return service.getAllComplaints();
    }

    @GetMapping("/{id}")
    public Complaint getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public Complaint updateStatus(@PathVariable Long id,
                                  @RequestParam Status status,
                                  @RequestParam(required = false) String resolutionNote) {

        Complaint updated = service.updateStatus(id, status, resolutionNote);

        messagingTemplate.convertAndSend("/topic/complaints", updated);

    return updated;
   

    }
    
    @PostMapping("/analyze")
    public Map<String, String> analyze(@RequestBody Map<String, String> body) {

        String desc = body.get("description");

        Map<String, String> result = new HashMap<>();

        com.example.demo.model.enums.Priority p =
                com.example.demo.util.ComplaintAnalyzer
                        .detectPriority(desc);

        String category =
                com.example.demo.util.ComplaintAnalyzer
                        .detectCategory(desc);

        String dept =
                com.example.demo.util.ComplaintAnalyzer
                        .detectDepartment(category);

        result.put("priority", p.name());
        result.put("category", category);
        result.put("department", dept);

        return result;
    }
    
    @Autowired
    private ChatAiService chatAiService;

    @PostMapping("/chat-ai")
    public String chatAi(@RequestBody Map<String,String> body){

        String msg = body.get("message");

        return chatAiService.askAI(msg);
    }
    @Autowired
    private AiServiceClient aiServiceClient;
    
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteComplaint(id);
    }
    
    @GetMapping("/stats")
    public Map<String, Long> getStats() {

        List<Complaint> complaints = service.getAllComplaints();

        long open = complaints.stream().filter(c -> c.getStatus() == Status.OPEN).count();
        long progress = complaints.stream().filter(c -> c.getStatus() == Status.IN_PROGRESS).count();
        long closed = complaints.stream().filter(c -> c.getStatus() == Status.CLOSED).count();

        Map<String, Long> stats = new HashMap<>();

        stats.put("total", Long.valueOf(complaints.size()));
        stats.put("open", open);
        stats.put("progress", progress);
        stats.put("closed", closed);

        return stats;
    }
    @PutMapping("/{id}/rate")
    public Complaint rateComplaint(@PathVariable Long id, @RequestParam Integer rating, @RequestParam(required = false) String feedback) {
        Complaint c = service.getById(id);
        if (c.getStatus() != Status.CLOSED) {
            throw new RuntimeException("Can only rate closed complaints");
        }
        c.setRating(rating);
        c.setUserFeedback(feedback);
        return service.updateComplaint(c);
    }
}