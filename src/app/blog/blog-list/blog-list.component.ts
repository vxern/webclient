// Angular
import { Component, OnInit } from '@angular/core';

// Models
import { Post } from '../shared/blog';

// Services
import { BlogService } from '../shared/blog.service';

//////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////


@Component({
  selector: 'app-blog-list',
  templateUrl: './blog-list.component.html',
  styleUrls: ['./blog-list.component.scss']
})
export class BlogListComponent implements OnInit {
  posts: Post[];
  firstPost: Post;
  postPosition: number = 0;
  positionCount: number = 7;

  constructor(
    private blogService: BlogService,
  ) {}

  ngOnInit() {
    this.getPosts();
  }

  getPosts() {
    this.blogService.getPosts(this.positionCount, this.postPosition)
    .subscribe((results) => {
      console.log(results);
      if (results.length) {
        this.sortPosts(results);
      }
    });
  }

  sortPosts(newPosts) {
    newPosts.map((post: Post) => {
      post.isloaded = false;
      if (post.text.length > 500) {
        post.excerpt = post.text.substring(0, 500) + '...';
      } else {
        post.excerpt = post.text;
      }
    });
    if (!this.postPosition) {
      this.firstPost = newPosts[0];
      this.posts = newPosts.slice(1);
      this.setParmsofPosts(newPosts.length, -1);
    } else {
      this.posts = this.posts.concat(newPosts);
      this.setParmsofPosts(newPosts.length, 0);
    }

  }

  setParmsofPosts(length, isFirst) {
    this.postPosition += length;
    if ((length - isFirst) < 6) {
      this.positionCount = 12 - length + isFirst;
    } else {
      this.positionCount = 6;
    }
  }
}
