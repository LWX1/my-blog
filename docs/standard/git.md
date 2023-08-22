---
title: git规范
date: 2022-3-10
tags:
    - 规范
categories:
    - 规范
---

## git规范

### 分支命名

- master：主分支，负责记录上线版本的迭代，该分支代码与线上代码是完全一致的。
- dev：开发分支，所有的新增分支从这里分离。其它分支为短期分支，其完成功能开发之后需要删除
- 其他分支：以开发者名字命名，负责自己相应的分支，开发功能和修复bug，测试通过后，合并到dev分支中。

### commit 提交说明

- 新增功能：feat: XXX
- 修复问题：fix: XXX
- 文档说明：docs: XXX
- 样式修改：style：XXX
  
### git 常用命令

#### 创建并拉取代码

```
<!-- 新增目录，初始化为git代码库 -->
git init [project-name]

<!-- 拉取代码 -->
git clone [url]

```

#### 增加/删除文件


```
<!-- 添加文件到暂存区 -->
git add [file1] [file2]

<!-- 添加所有文件到暂存区 -->
git add .

<!-- 移除工作区文件，并放入暂存区 -->
git rm [file1] [file2]

```

#### 代码提交

```
<!-- 提交暂存区到仓库区 -->
git commit -m [message]

<!-- 推送代码到远程分支 -->
git push origin [branch-name]

```

#### 分支

```
<!-- 列出所有的分支 -->
git branch -a

<!-- 新建分支，并切换到该分支 -->
git checkout -b [branch]

<!-- 切换分支 -->
git checkout [branch-name]

<!-- 新增本地分支推送到远程分支 -->
git push --set-upstream origin [branch-name]

<!-- 合并指定分支到当前分支 -->
git merge [branch-name]

<!-- 删除本地分支 -->
git branch -d [branch-name]

<!-- 删除远程文件 -->
git push origin --delete [branch-name]

<!-- 拉去远程分支合并本地 -->
git pull origin [branch-name]

```

#### 回退版本

```
<!-- 显示版本历史 -->
git log

<!-- 版本回退 -->
git reset --hard log_id

<!-- 推送 -->
git push origin [branch-name]

```

#### 其他

```
<!-- 当前状态 -->
git status

```
