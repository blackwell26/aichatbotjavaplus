package com.company.chatbot.api;

import com.company.chatbot.analytics.AnalyticsService;
import com.company.chatbot.analytics.AnalyticsSnapshot;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.format.support.DefaultFormattingConversionService;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ManagerAnalyticsControllerTest {

    @Test
    void returnsAggregatedAnalytics() throws Exception {
        AnalyticsService service = Mockito.mock(AnalyticsService.class);
        when(service.aggregate(any(), any())).thenReturn(new AnalyticsSnapshot());
        MockMvc mvc = mvc(new ManagerAnalyticsController(service));

        mvc.perform(get("/api/v1/manager/analytics")
                        .param("periodStart", "2026-07-01T00:00:00Z")
                        .param("periodEnd", "2026-07-02T00:00:00Z")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void recordsSnapshot() throws Exception {
        AnalyticsService service = Mockito.mock(AnalyticsService.class);
        when(service.record(any(), any())).thenReturn(new AnalyticsSnapshot());
        MockMvc mvc = mvc(new ManagerAnalyticsController(service));

        mvc.perform(post("/api/v1/manager/analytics/snapshots")
                        .param("periodStart", "2026-07-01T00:00:00Z")
                        .param("periodEnd", "2026-07-02T00:00:00Z")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    private static MockMvc mvc(ManagerAnalyticsController controller) {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        DefaultFormattingConversionService conversionService = new DefaultFormattingConversionService();
        return MockMvcBuilders.standaloneSetup(controller)
                .setValidator(validator)
                .setConversionService(conversionService)
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }
}
