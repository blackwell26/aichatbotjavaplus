package com.company.chatbot.observability;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class CorrelationIdFilterTest {

    @Test
    void propagatesAndEchoesCorrelationAndRequestIds() throws Exception {
        CorrelationIdFilter filter = new CorrelationIdFilter();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/chat/sessions");
        request.addHeader(CorrelationIdFilter.CORRELATION_ID_HEADER, "corr-123");
        request.addHeader(CorrelationIdFilter.REQUEST_ID_HEADER, "req-456");
        request.addHeader(CorrelationIdFilter.SESSION_ID_HEADER, "session-789");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertThat(response.getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER)).isEqualTo("corr-123");
        assertThat(response.getHeader(CorrelationIdFilter.REQUEST_ID_HEADER)).isEqualTo("req-456");
        assertThat(response.getHeader(CorrelationIdFilter.SESSION_ID_HEADER)).isEqualTo("session-789");
    }
}
