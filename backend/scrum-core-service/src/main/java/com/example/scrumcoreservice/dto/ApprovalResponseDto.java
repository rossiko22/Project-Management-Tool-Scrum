package com.example.scrumcoreservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalResponseDto {

    private boolean approved;

    private String rejectionReason;

    public static ApprovalResponseDto approve() {
        return ApprovalResponseDto.builder()
                .approved(true)
                .build();
    }

    public static ApprovalResponseDto reject(String reason) {
        return ApprovalResponseDto.builder()
                .approved(false)
                .rejectionReason(reason)
                .build();
    }
}
