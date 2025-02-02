"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { last } from "lodash";

import { useAuth } from "@/hooks/useAuth";
import Iconify from "@/components/iconify";
import { useCommentList, useCommentReplyList } from "@/hooks/core";
import { CommentResponse, GetUserResponse } from "@/types";
import { Utils } from "@/utils";
import { AppApi } from "@/api";

import Pagination from "../Pagination";
import Markdown from "../Markdown";
import CommentEditor from "./comment-editor";
import RoleBadge from "../role-badge";

export default function CommentSection({
  typeId,
  type,
}: {
  typeId: string;
  type: "series" | "chapter";
}) {
  const { user } = useAuth();
  const [page, setPage] = useState(0);
  const [pageTotal, setPageTotal] = useState(1);
  const { data, mutate } = useCommentList({ type, typeId, page: page + 1 });

  const onSubmitComment = useCallback(
    async (content: string) => {
      try {
        await AppApi.Comment.storeComment({
          content,
          type,
          typeId,
          parentId: 0,
        });
        toast("Bình luận thành công!");
        mutate();
      } catch (error) {
        Utils.Error.handleError(error);
      }
    },
    [mutate],
  );

  useEffect(() => {
    if (data)
      setPageTotal(
        Math.floor(data.comments.total / data.comments.per_page) + 1,
      );
  }, [data, setPageTotal]);

  return (
    <div>
      <ul className="nav nav-tabs main-tab lazy-module">
        <li className="active">
          <a data-toggle="tab" href="#nt_comments">
            <Iconify className="mr-2 inline" icon="fa:comments" />
            Bình luận
          </a>
        </li>
      </ul>
      <div className="comment-wrapper">
        {user ? <CommentEditor onSumbit={onSubmitComment} /> : <></>}
        <div className="comment-list comment-default">
          {data?.comments.data.map((comment) => (
            <CommentItem
              comment={comment}
              typeId={typeId}
              type={type}
              user={user}
              refresh={() => mutate()}
            />
          ))}
        </div>
        <Pagination
          forcePage={page}
          pageCount={pageTotal}
          onPageChange={(event) => setPage(event.selected)}
        />
      </div>
    </div>
  );
}

export function CommentItem({
  comment,
  type,
  typeId,
  user,
  refresh,
}: {
  comment: CommentResponse;
  typeId: string;
  type: "series" | "chapter";
  user?: GetUserResponse | null;
  refresh: () => void;
}) {
  const [openReply, setOpenReply] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMore, setViewMore] = useState(false);

  const { data, size, setSize, isLoading } = useCommentReplyList(
    viewMore && comment.reply_count > 2 && comment.replies
      ? last(comment.replies)!.id
      : null,
  );

  const replies = data ? data.flatMap((page) => page.replies) : [];
  const isReachingEnd = comment.reply_count <= replies.length + 2;

  const onSubmitComment = useCallback(async (content: string) => {
    try {
      await AppApi.Comment.storeComment({
        content,
        type,
        typeId,
        parentId: comment.id,
      });
      toast("Trả lời bình luận thành công!");
      refresh();
      setOpenReply(false);
    } catch (error) {
      Utils.Error.handleError(error);
    }
  }, []);

  const onDeleteComment = useCallback(async () => {
    try {
      await AppApi.Comment.deleteComment({
        id: comment.id,
      });
      toast("Xoá lời bình luận thành công!");
      refresh();
    } catch (error) {
      Utils.Error.handleError(error);
    }
  }, []);

  const onSubmitEditedComment = useCallback(async (content: string) => {
    try {
      await AppApi.Comment.updateComment({
        content,
        id: comment.id,
      });
      toast("Sửa lời bình luận thành công!");
      refresh();
      setEditMode(false);
    } catch (error) {
      Utils.Error.handleError(error);
    }
  }, []);

  return (
    <div className="item clearfix pb-0" key={comment.id}>
      <figure className="avatar avatar-wrap">
        <img
          src={"/nettruyen/images/default-avatar.jpg"}
          alt={comment.user.name}
          className="lazy"
        />
      </figure>
      <div className="summary">
        {editMode ? (
          <CommentEditor
            content={comment.content}
            onSumbit={onSubmitEditedComment}
          />
        ) : (
          <div className="info border-gray-600">
            <div className="comment-header flex gap-2 border-gray-600">
              <div className="authorname name-1">{comment.user.name}</div>
              <div>
                {comment.user.display_roles.map((role) => (
                  <RoleBadge role={role} />
                ))}
              </div>
            </div>
            <div className="comment-content">
              <Markdown content={comment.content} />
            </div>
          </div>
        )}
        <ul className="comment-footer">
          {user && comment.parent_id === 0 && (
            <li>
              <span onClick={() => setOpenReply(!openReply)}>
                <i className="fa fa-comment"> </i> Trả lời
              </span>
            </li>
          )}
          {user && (
            <li className="comment-more-wrap">
              <Menu>
                <MenuButton>
                  <span className="more-action">
                    <i className="fa fa-ellipsis-h"> </i>
                  </span>
                </MenuButton>
                <MenuItems anchor="bottom">
                  <MenuItem>
                    <div
                      onClick={() => setEditMode(!editMode)}
                      className="cursor-pointer bg-white px-4 py-2 text-black hover:bg-slate-100"
                    >
                      {editMode ? "Thoát sửa" : "Sửa"}
                    </div>
                  </MenuItem>
                  <MenuItem>
                    <div
                      onClick={() => onDeleteComment()}
                      className="cursor-pointer bg-white px-4 py-2 text-black hover:bg-slate-100"
                    >
                      Xoá
                    </div>
                  </MenuItem>
                </MenuItems>
              </Menu>
            </li>
          )}
          <li>
            <abbr>
              <i className="fa fa-clock-o"> </i>
              {Utils.Date.formatDateTime(new Date(comment.created_at))}
            </abbr>
          </li>
        </ul>
        {openReply && <CommentEditor onSumbit={onSubmitComment} />}
        {comment.replies &&
          comment.replies.map((replyComment) => (
            <CommentItem
              comment={replyComment}
              refresh={refresh}
              type={type}
              typeId={typeId}
              user={user}
            />
          ))}
        {replies.map((replyComment) => (
          <CommentItem
            comment={replyComment}
            refresh={refresh}
            type={type}
            typeId={typeId}
            user={user}
          />
        ))}
        {!isReachingEnd &&
          comment.parent_id === 0 &&
          comment.reply_count > 2 && (
            <div className="flex cursor-pointer justify-center gap-2">
              <Iconify className="text-orange-500" icon="fa:angle-down" />
              <div
                onClick={() =>
                  !viewMore ? setViewMore(true) : setSize(size + 1)
                }
                className="text-base font-bold text-orange-500"
              >
                {isLoading ? "Đang tải..." : "Xem thêm"}
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
