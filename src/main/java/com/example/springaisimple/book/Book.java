package com.example.springaisimple.book;

import java.util.List;

public record Book(
        String title,
        String author,
        String publisher,
        int yearPublished,
        List<String> topics
) {}