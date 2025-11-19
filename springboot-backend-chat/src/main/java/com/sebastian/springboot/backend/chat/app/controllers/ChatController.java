package com.sebastian.springboot.backend.chat.app.controllers;

import com.sebastian.springboot.backend.chat.app.models.Message;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.util.Date;
import java.util.Random;

@Controller
public class ChatController {

    private String[] colors= {"red","blue","green","magenta","orange","purple","yellow"};
    @MessageMapping("/message")
    @SendTo("/chat/message")
    public Message reciveMessage(Message message){
        message.setDate(new Date().getTime());
        //message.setText("Recibido por el broker: " + message.getText());
        if(message.getType().equals("NEW_USER")){
            message.setColor(this.colors[new Random().nextInt(colors.length)]);
            message.setText("nuevo usuario");
        }
        return message;
    }

    @MessageMapping("/writing")
    @SendTo("/chat/writing")
    public String isWriting(String username){
        return username.concat(" esta escribiendo ...");
    }
}
