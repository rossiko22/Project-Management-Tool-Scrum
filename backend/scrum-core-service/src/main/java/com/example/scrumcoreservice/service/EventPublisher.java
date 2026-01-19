package com.example.scrumcoreservice.service;

import com.example.scrumcoreservice.events.BacklogItemEvent;
import com.example.scrumcoreservice.events.SprintEvent;
import com.example.scrumcoreservice.events.TaskEvent;
import com.example.scrumcoreservice.events.ApprovalEvent;
import com.example.scrumcoreservice.events.ImpedimentEvent;
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
    private static final String APPROVAL_TOPIC = "scrum.approval";
    private static final String IMPEDIMENT_TOPIC = "scrum.impediment";

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

    public void publishApprovalEvent(ApprovalEvent event) {
        CompletableFuture<SendResult<String, Object>> future =
            kafkaTemplate.send(APPROVAL_TOPIC, event.getBacklogItemId().toString(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish approval event: {}", event, ex);
            } else {
                log.info("Published approval event: {} to topic: {}", event.getAction(), APPROVAL_TOPIC);
            }
        });
    }

    public void publishImpedimentEvent(ImpedimentEvent event) {
        CompletableFuture<SendResult<String, Object>> future =
            kafkaTemplate.send(IMPEDIMENT_TOPIC, event.getImpedimentId().toString(), event);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish impediment event: {}", event, ex);
            } else {
                log.info("Published impediment event: {} to topic: {}", event.getAction(), IMPEDIMENT_TOPIC);
            }
        });
    }
}
