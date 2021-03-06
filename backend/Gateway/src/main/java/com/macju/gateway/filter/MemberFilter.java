package com.macju.gateway.filter;

import com.google.gson.JsonElement;
import com.google.gson.JsonParser;
import lombok.Data;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;


@Component
public class MemberFilter extends AbstractGatewayFilterFactory<MemberFilter.Config> {
    private static final Logger logger = LogManager.getLogger(MemberFilter.class);
    public MemberFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        System.out.println("Member In After Return");
        return ((exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            ServerHttpResponse response = exchange.getResponse();
            HttpHeaders headers = request.getHeaders();
            String token = headers.getFirst("AccessToken");

            logger.info("MemberFilter baseMessage>>>>>>" + config.getBaseMessage());
            if (config.isPreLogger()) {
                logger.info("MemberFilter Start>>>>>>" + exchange.getRequest());
            }
            return chain.filter(exchange).then(Mono.fromRunnable(()->{
                if (config.isPostLogger()) {
                    logger.info(exchange.getAttributes().get("memberId"));
                    logger.info(exchange.getResponse().getCookies().get("memberId"));
                    response.getHeaders().forEach((k,v)->{
                        logger.info(k+" : "+v);
                    });
                    String json = "{\"memberId\" : \"" + response.getHeaders().get("memberId").get(0)+"\","+
                                    "\"kakaoId\" : \"" + response.getHeaders().get("kakaoId").get(0) +"\","+
                                    "\"accessToken\" : \"" + token+ "\""+
                            "}";
                    logger.info(json);
                    String status = httpPostBodyConnection("http://i6c107.p.ssafy.io:8752/oauth/signup",json);
                    logger.info(status);
                    if(!status.equals("200")){
                        response.setStatusCode(HttpStatus.BAD_REQUEST);
                    }
                    logger.info(json);
                    logger.info("MemberFilter End>>>>>>" + exchange.getResponse());
                }
            }));
        });
    }

    public static String httpPostBodyConnection(String UrlData, String ParamData) {

        //http ?????? ??? ????????? url ????????? ?????? ??????
        String totalUrl = "";
        totalUrl = UrlData.trim().toString();
        HttpStatus status = null;
        //http ????????? ???????????? ?????? ?????? ??????
        URL url = null;
        HttpURLConnection conn = null;

        //http ?????? ?????? ??? ?????? ?????? ???????????? ?????? ?????? ??????
        String responseData = "";
        BufferedReader br = null;
        StringBuffer sb = null;
        String result = "";
        //????????? ?????? ???????????? ???????????? ?????? ??????
        String returnData = "";
        String responseCode = "";
        try {
            //??????????????? ????????? url??? ????????? connection ??????
            url = new URL(totalUrl);
            conn = (HttpURLConnection) url.openConnection();

            //http ????????? ????????? ?????? ?????? ??????
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; utf-8"); //post body json?????? ????????? ??????
//            conn.setRequestProperty("Accept", "application/json");
            conn.setDoOutput(true); //OutputStream??? ???????????? post body ????????? ??????
            try (OutputStream os = conn.getOutputStream()){
                byte request_data[] = ParamData.getBytes("utf-8");
                os.write(request_data);
                os.close();
            }
            catch(Exception e) {
                e.printStackTrace();
            }

            //http ?????? ??????
            conn.connect();

            //http ?????? ??? ?????? ?????? ???????????? ????????? ?????????
            br = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"));
            sb = new StringBuffer();
            while ((responseData = br.readLine()) != null) {
                sb.append(responseData); //StringBuffer??? ???????????? ????????? ??????????????? ?????? ??????
            }

            //????????? ?????? ?????? ??? ???????????? ????????? ?????? ????????? ?????? ??????
            returnData = sb.toString();

            //http ?????? ?????? ?????? ?????? ??????
            responseCode = String.valueOf(conn.getResponseCode());
            System.out.println("http ?????? ?????? : "+responseCode);

//            status = HttpStatus.valueOf(responseCode);


        } catch (IOException e) {
            e.printStackTrace();

        } finally {
            //http ?????? ??? ?????? ?????? ??? BufferedReader??? ???????????????
            try {
                if (br != null) {
                    br.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
            return responseCode;
        }

    }

    @Data
    public static class Config{
        private String baseMessage;
        private boolean preLogger;
        private boolean postLogger;
    }

}