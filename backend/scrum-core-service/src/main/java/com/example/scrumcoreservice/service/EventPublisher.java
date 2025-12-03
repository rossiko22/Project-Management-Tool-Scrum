package com.example.scrumcoreservice.service;

import com.example.scrumcoreservice.events.BacklogItemEvent;
import com.example.scrumcoreservice.events.SprintEvent;
import com.example.scrumcoreservice.events.TaskEvent;
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

    private static final String BACKLOG_TOPIC = "scrum.backlog-item";
    private static final String SPRINT_TOPIC = "scrum.sprint";
    private static final String TASK_TOPIC = "scrum.task";

    public void publishBacklogItemEvent(BacklogItemEvent event) {
        CompletableFuture<SendResult<String, Object>> future =
            kafkaTemplate.send(BACKLOG_TOPIC, event.getItemId().toString(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish backlog item event: {}", event, ex);
            } else {
                log.info("Published backlog item event: {} to topic: {}", event.getAction(), BACKLOG_TOPIC);
            }
        });
    }

    public void publishSprintEvent(SprintEvent event) {
        CompletableFuture<SendResult<String, Object>> future =
            kafkaTemplate.send(SPRINT_TOPIC, event.getSprintId().toString(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish sprint event: {}", event, ex);
            } else {
                log.info("Published sprint event: {} to topic: {}", event.getAction(), SPRINT_TOPIC);
            }
        });
    }

    public void publishTaskEvent(TaskEvent event) {
        CompletableFuture<SendResult<String, Object>> future =
            kafkaTemplate.send(TASK_TOPIC, event.getTaskId().toString(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish task event: {}", event, ex);
            } else {
                log.info("Published task event: {} to topic: {}", event.getAction(), TASK_TOPIC);
            }
        });
    }
}
