package net.ravendb.demo.basic;

import net.ravendb.client.documents.session.IDocumentSession;
import net.ravendb.demo.DocumentStoreHolder;
import net.ravendb.demo.entities.Order;
import net.ravendb.demo.indexes.OrderByCompanyAndCountryWithBoost;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@Controller
public class BoostingEnabled {

    @GetMapping("/basic/boostingEnabled")
    public List<Order> boostingEnabled(
            @RequestParam(value = "city", defaultValue = "London") String city,
            @RequestParam(value = "country", defaultValue = "Denmark") String country) {

        try (IDocumentSession session = DocumentStoreHolder.getStore().openSession()) {
            List<Order> orders = session.query(Order.class, OrderByCompanyAndCountryWithBoost.class)
                    .whereEquals("ShipTo_City", city)
                    .orElse()
                    .whereEquals("ShipTo_Country", country)
                    .toList();

            return orders;
        }
    }
}
