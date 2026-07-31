package com.company.chatbot.api;

import com.company.chatbot.context.CurrentCustomer;
import com.company.chatbot.context.CustomerContext;
import com.company.chatbot.ecommerce.client.ProductClient;
import com.company.chatbot.ecommerce.client.ProductClient.InventoryInfo;
import com.company.chatbot.ecommerce.client.ProductClient.PricingInfo;
import com.company.chatbot.ecommerce.client.ProductClient.ProductDetails;
import com.company.chatbot.ecommerce.client.ProductClient.ProductSearchResult;
import com.company.chatbot.ecommerce.client.ProductClient.ProductSpecifications;
import com.company.chatbot.security.validation.IdValidator;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/v1/products")
@Validated
@PreAuthorize("hasAnyRole('CUSTOMER','AGENT','MANAGER','ADMIN','SYSTEM')")
public class ProductController {

    private static final Logger log = LoggerFactory.getLogger(ProductController.class);

    private final ProductClient productClient;

    public ProductController(ProductClient productClient) {
        this.productClient = productClient;
    }

    @GetMapping("/search")
    public List<ProductSearchResult> search(@RequestParam("q") String query) {
        log.info("search requested queryLength={}", query != null ? query.length() : 0);
        return productClient.search(query);
    }

    @GetMapping("/{productId}")
    public ProductDetails getProduct(@PathVariable String productId,
                                     @CurrentCustomer CustomerContext customer) {
        log.info("getProduct requested productId={} customerId={}", productId, customer != null ? customer.getCustomerId() : "anonymous");
        return productClient.getProduct(IdValidator.requireValidResourceId(productId, "productId"));
    }

    @GetMapping("/{productId}/pricing")
    public PricingInfo getPricing(@PathVariable String productId) {
        log.info("getPricing requested productId={}", productId);
        return productClient.getPricing(IdValidator.requireValidResourceId(productId, "productId"));
    }

    @GetMapping("/{productId}/specifications")
    public ProductSpecifications getSpecifications(@PathVariable String productId) {
        log.info("getSpecifications requested productId={}", productId);
        return productClient.getSpecifications(IdValidator.requireValidResourceId(productId, "productId"));
    }

    @GetMapping("/{productId}/inventory")
    public InventoryInfo getInventory(@PathVariable String productId) {
        log.info("getInventory requested productId={}", productId);
        return productClient.checkInventory(IdValidator.requireValidResourceId(productId, "productId"));
    }
}
