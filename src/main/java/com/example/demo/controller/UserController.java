package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.model.enums.Role;
import com.example.demo.repository.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.example.demo.security.JwtUtil;
import java.util.Map;
import java.util.HashMap;

import java.util.Optional;

@RestController
@RequestMapping("/users")
@CrossOrigin("*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

   
    @PostMapping("/register")
    public User register(@RequestBody User user) {

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setRole(Role.USER);

        return userRepository.save(user);
    }

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;
    
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody User user) {

        Optional<User> existing =
                userRepository.findByEmail(user.getEmail());

        if(existing.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User dbUser = existing.get();

        if(!passwordEncoder.matches(user.getPassword(), dbUser.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtUtil.generateToken(dbUser.getEmail());

        Map<String,Object> response = new HashMap<>();
        response.put("user", dbUser);
        response.put("token", token);

        return response;
    }

    @PostMapping("/google-login")
    public Map<String,Object> googleLogin(@RequestBody User user){

        Optional<User> existing =
                userRepository.findByEmail(user.getEmail());

        User dbUser;

        if(existing.isPresent()){
            dbUser = existing.get();
        }else{
            user.setRole(Role.USER);
            dbUser = userRepository.save(user);
        }

        String token = jwtUtil.generateToken(dbUser.getEmail());

        Map<String,Object> response = new HashMap<>();
        response.put("user", dbUser);
        response.put("token", token);

        return response;
    }
    @PostMapping("/forgot-password")
    public String forgot(@RequestParam String email,
                         @RequestParam String newPassword){

        Optional<User> userOpt =
                userRepository.findByEmail(email);

        if(userOpt.isEmpty()){
            return "User not found";
        }

        User user = userOpt.get();

        user.setPassword(passwordEncoder.encode(newPassword));

        userRepository.save(user);

        return "Password reset success";
    }

    @GetMapping("/all")
    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    @PutMapping("/profile")
    public User updateProfile(@RequestParam Long id, @RequestParam String name) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setName(name);
        return userRepository.save(user);
    }
 
}
