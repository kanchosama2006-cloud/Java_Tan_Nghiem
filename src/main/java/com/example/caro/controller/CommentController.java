package com.example.caro.controller;

import com.example.caro.dto.CreateCommentRequest;
import com.example.caro.dto.GameCommentResponse;
import com.example.caro.dto.GameCommentSummaryResponse;
import com.example.caro.service.CommentService;
import com.example.caro.util.SessionUser;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/games/{gameId}/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping
    public GameCommentSummaryResponse getComments(@PathVariable("gameId") Long gameId) {
        return commentService.getCommentsForGame(gameId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GameCommentResponse addComment(@PathVariable("gameId") Long gameId,
                                          @Valid @RequestBody CreateCommentRequest request,
                                          HttpSession session) {
        return commentService.addComment(SessionUser.id(session), gameId, request);
    }
}
