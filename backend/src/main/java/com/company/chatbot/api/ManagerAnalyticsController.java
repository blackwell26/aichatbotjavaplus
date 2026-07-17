package com.company.chatbot.api;

import com.company.chatbot.analytics.AnalyticsService;
import com.company.chatbot.analytics.AnalyticsSnapshot;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/manager/analytics")
@Validated
@PreAuthorize("hasAnyRole('MANAGER','ADMIN','SYSTEM')")
@ConditionalOnBean(AnalyticsService.class)
public class ManagerAnalyticsController {

    private final AnalyticsService analyticsService;

    public ManagerAnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping
    public ResponseEntity<AnalyticsSnapshot> getAnalytics(
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant periodStart,
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant periodEnd) {
        return ResponseEntity.ok(analyticsService.aggregate(periodStart, periodEnd));
    }

    @PostMapping("/snapshots")
    public ResponseEntity<AnalyticsSnapshot> recordSnapshot(
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant periodStart,
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant periodEnd) {
        return ResponseEntity.ok(analyticsService.record(periodStart, periodEnd));
    }

    @GetMapping("/snapshots")
    public ResponseEntity<List<AnalyticsSnapshot>> listSnapshots(
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end) {
        return ResponseEntity.ok(analyticsService.listRecordedSnapshots(start, end));
    }
}
