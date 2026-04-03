package com.example.demo.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class AiServiceClient {

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, String> analyzeText(String text) {

        String url = "http://localhost:8000/predict";

        Map<String, String> request = Map.of(
                "text", text
        );

        return restTemplate.postForObject(url, request, Map.class);
    }
}