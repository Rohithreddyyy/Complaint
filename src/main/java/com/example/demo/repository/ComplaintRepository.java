package com.example.demo.repository;

import com.example.demo.model.Complaint;
import com.example.demo.model.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByStatus(Status status);

    List<Complaint> findByTitleContainingIgnoreCase(String title);
    
    List<Complaint> findByUserId(Long userId);

}