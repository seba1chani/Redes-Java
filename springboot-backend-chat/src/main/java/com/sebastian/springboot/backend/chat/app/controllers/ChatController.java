/*package com.sebastian.springboot.backend.chat.app.controllers;

import com.sebastian.springboot.backend.chat.app.models.Message;
import com.sebastian.springboot.backend.chat.app.services.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Date;
import java.util.List;
import java.util.Random;

@Controller
public class ChatController {

    private String[] colors= {"red","blue","green","magenta","orange","purple","yellow"};
    private final MessageService service;

    @Autowired
    private SimpMessagingTemplate webSocket;

    public ChatController(MessageService service) {
        this.service = service;
    }

    @MessageMapping("/message")
    @SendTo("/chat/message")
    public Message reciveMessage(Message message){
        message.setDate(new Date().getTime());
        //message.setText("Recibido por el broker: " + message.getText());
        if(message.getType().equals("NEW_USER")){
            message.setColor(this.colors[new Random().nextInt(colors.length)]);
            message.setText("nuevo usuario");
        }else{
            service.save(message);
        }
        return message;
    }

    @MessageMapping("/writing")
    @SendTo("/chat/writing")
    public String isWriting(String username){
        return username.concat(" esta escribiendo ...");
    }

    @MessageMapping("/history")
    public void getHistoryMessage(String clientId){
        webSocket.convertAndSend("/chat/history/".concat(clientId),service.findAll()) ;
    }
}
*/