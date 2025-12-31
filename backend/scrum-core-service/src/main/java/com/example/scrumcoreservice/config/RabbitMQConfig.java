package com.example.scrumcoreservice.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.CachingConnectionFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${spring.rabbitmq.host:rabbitmq}")
    private String rabbitmqHost;

    @Value("${spring.rabbitmq.port:5672}")
    private int rabbitmqPort;

    @Value("${spring.rabbitmq.username:admin}")
    private String rabbitmqUsername;

    @Value("${spring.rabbitmq.password:admin}")
    private String rabbitmqPassword;

    public static final String LOGGING_EXCHANGE = "logging_exchange";
    public static final String LOGGING_QUEUE = "logging_queue";
    public static final String LOGGING_ROUTING_KEY = "logs";

    @Bean
    public ConnectionFactory connectionFactory() {
        CachingConnectionFactory connectionFactory = new CachingConnectionFactory();
        connectionFactory.setHost(rabbitmqHost);
        connectionFactory.setPort(rabbitmqPort);
        connectionFactory.setUsername(rabbitmqUsername);
        connectionFactory.setPassword(rabbitmqPassword);
        return connectionFactory;
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }

    @Bean
    public TopicExchange loggingExchange() {
        return new TopicExchange(LOGGING_EXCHANGE, true, false);
    }

    @Bean
    public Queue loggingQueue() {
        return new Queue(LOGGING_QUEUE, true);
    }

    @Bean
    public Binding loggingBinding(Queue loggingQueue, TopicExchange loggingExchange) {
        return BindingBuilder.bind(loggingQueue)
                .to(loggingExchange)
                .with(LOGGING_ROUTING_KEY);
    }
}
