package com.example.identityservice.service;

import com.example.identityservice.events.ProjectEvent;
import com.example.identityservice.events.TeamEvent;
import com.example.identityservice.events.UserEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String USER_TOPIC = "identity.user";
    private static final String TEAM_TOPIC = "identity.team";
    private static final String PROJECT_TOPIC = "identity.project";

    public void publishUserEvent(UserEvent event) {
        CompletableFuture<SendResult<String, Object>> future =
            kafkaTemplate.send(USER_TOPIC, event.getUserId().toString(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish user event: {}", event, ex);
            } else {
                log.info("Published user event: {} to topic: {}", event.getAction(), USER_TOPIC);
            }
        });
    }

    public void publishTeamEvent(TeamEvent event) {
        CompletableFuture<SendResult<String, Object>> future =
            kafkaTemplate.send(TEAM_TOPIC, event.getTeamId().toString(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish team event: {}", event, ex);
            } else {
                log.info("Published team event: {} to topic: {}", event.getAction(), TEAM_TOPIC);
            }
        });
    }

    public void publishProjectEvent(ProjectEvent event) {
        CompletableFuture<SendResult<String, Object>> future =
            kafkaTemplate.send(PROJECT_TOPIC, event.getProjectId().toString(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish project event: {}", event, ex);
            } else {
                log.info("Published project event: {} to topic: {}", event.getAction(), PROJECT_TOPIC);
            }
        });
    }
}
