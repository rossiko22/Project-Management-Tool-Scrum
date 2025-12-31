package com.example.identityservice.service;

import com.example.identityservice.config.CorrelationIdFilter;
import com.example.identityservice.config.RabbitMQConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RabbitMQLoggerService {

    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String APPLICATION_NAME = "identity-service";

    public void logInfo(String message, String url) {
        sendLog("INFO", message, url);
    }

    public void logWarn(String message, String url) {
        sendLog("WARN", message, url);
    }

    public void logError(String message, String url) {
        sendLog("ERROR", message, url);
    }

    public void logDebug(String message, String url) {
        sendLog("DEBUG", message, url);
    }

    private void sendLog(String logType, String message, String url) {
        try {
            String correlationId = CorrelationIdFilter.getCurrentCorrelationId();

            Map<String, Object> logMessage = new HashMap<>();
            logMessage.put("timestamp", Instant.now().toString());
            logMessage.put("logType", logType);
            logMessage.put("url", url);
            logMessage.put("correlationId", correlationId);
            logMessage.put("applicationName", APPLICATION_NAME);
            logMessage.put("message", message);

            String jsonMessage = objectMapper.writeValueAsString(logMessage);

            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.LOGGING_EXCHANGE,
                    RabbitMQConfig.LOGGING_ROUTING_KEY,
                    jsonMessage
            );

            log.debug("Sent log to RabbitMQ: {} {} Correlation: {} [{}] - {}",
                    Instant.now(), logType, correlationId, APPLICATION_NAME, message);
        } catch (Exception e) {
            log.error("Failed to send log to RabbitMQ: {}", e.getMessage());
        }
    }
}
