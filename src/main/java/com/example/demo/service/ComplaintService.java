package com.example.demo.service;

import com.example.demo.model.Complaint;
import com.example.demo.model.enums.Status;
import com.example.demo.repository.ComplaintRepository;
import com.example.demo.util.ComplaintAnalyzer;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ComplaintService {

    private final ComplaintRepository repo;

    public ComplaintService(ComplaintRepository repo) {
        this.repo = repo;
    }

    public Complaint createComplaint(Complaint c) {

        c.setPriority(
                ComplaintAnalyzer.detectPriority(c.getDescription())
        );

        String category =
                ComplaintAnalyzer.detectCategory(c.getDescription());

        c.setCategory(category);

        c.setDepartment(
                ComplaintAnalyzer.detectDepartment(category)
        );

        c.setSentiment(
                ComplaintAnalyzer.detectSentiment(c.getDescription())
        );

        c.setStatus(Status.OPEN);
        c.setCreatedDate(LocalDateTime.now());

        return repo.save(c);
    }

    public List<Complaint> getAll(){
        return repo.findAll();
    }
    
    public List<Complaint> getUserComplaints(Long userId){
        return repo.findByUserId(userId);
    }
    
    public List<Complaint> getAllComplaints() {
        return repo.findAll();
    }

    public List<Complaint> getByStatus(Status status) {
        return repo.findByStatus(status);
    }

    public List<Complaint> searchByTitle(String title) {
        return repo.findByTitleContainingIgnoreCase(title);
    }

    public Complaint getById(Long id) {
        return repo.findById(id).orElseThrow();
    }

    public Complaint updateStatus(Long id, Status status, String resolutionNote) {

        Complaint c = getById(id);
        c.setStatus(status);
        c.setUpdatedDate(LocalDateTime.now());
        
        if (resolutionNote != null && !resolutionNote.trim().isEmpty()) {
            c.setResolutionNote(resolutionNote);
        }

        return repo.save(c);
    }

    public Complaint updateComplaint(Complaint c) {
        return repo.save(c);
    }

    public void deleteComplaint(Long id) {
        repo.deleteById(id);
    }
}