;(function () {
    'use strict';/*目的是指定代码在严格条件下执行，严格模式下你不能使用未声明的变量*/
    var $form_add_task = $('.add-task')
        , task_list = []
        , $delete_task
        , $detail_task
        , $task_item
        , $task_detail = $('.task-detail')
        , $task_detail_mask = $('.task-detail-mask')
        , $update_form
        , $update_form_content
        , $update_form_content_input
        , $checkbox_complete
        , $msg = $('.msg')
        , $msg_content = $msg.find('.msg-content')
        , $msg_confirm = $msg.find('.anchor.confirmed')
        , $alert = $('.alerter')
        ;

    init();
    listen_add_task();

    /*监控任务添加按钮*/
    function listen_add_task() {
        $form_add_task.on('submit', function (e) {
            var new_task = {}, $input;
            e.preventDefault();
            $input = $(this).find('input[name=content]');
            new_task.content = $input.val();
            if(!new_task.content) return;
            if(add_task(new_task)){
                $input.val('');
            }
        })
    }

    /*监控任务删除按钮*/
    function listen_delete_task() {
        $delete_task.on('click', function () {
            var $this = $(this);
            var index = $this.parent().parent().data('index');
            var tmp = confirm('确定删除？');
            tmp ? delete_task(index) : null;
        })
    }

    /*监控任务详情按钮和双击任务列*/
    function listen_detail_task() {
        $detail_task.on('click', function () {
            var $this = $(this);
            var index = $this.parent().parent().data('index');
            show_task_detail(index);
        })
        $task_item.on('dblclick', function () {
            var $this = $(this);
            var index = $this.data('index');
            show_task_detail(index);
        })
    }

    /*监控打勾*/
    function listen_checkbox_complete() {
        $checkbox_complete.on('click', function () {
            var $this = $(this);
            var index = $this.parent().parent().data('index');
            var item = get(index);
            if(item.complete)
                update_task(index, {complete: false});
            else
                update_task(index, {complete: true});
        })
    }

    /*监控确认提示*/
    function listen_msg_confirm() {
        $msg_confirm.on('click', function () {
            hide_show();
        })
    }

    /*检查时间是否到*/
    function task_remind_check() {
        var current_timestamp;
        var itl = setInterval(function () {
            for(var i = 0; i < task_list.length; i++){
                var item = get(i), task_timestamp;
                if(!item || !item.remind_date || item.informed || item.complete) continue;
                current_timestamp = (new Date()).getTime();
                task_timestamp = (new Date(item.remind_date)).getTime();
                if(task_timestamp - current_timestamp <= 1 ){
                    update_task(i, {informed: true})
                    show_msg(item.content);
                }
            }
        }, 300);
    }

    /*展示提示*/
    function show_msg(msg) {
        if(!msg) return;
        $msg_content.html(msg);
        $alert.get(0).play();
        $msg.show();
    }

    /*确认隐藏提示*/
    function hide_show() {
        $msg.hide();
    }

    /*初始化展示，做离线存储，即使关掉浏览器，再打开也能看到之前存储的内容*/
    function init() {
        task_list = store.get('task_list') || [];
        listen_msg_confirm();
        if(task_list.length)
            render_task_list();
        task_remind_check();
    }

    /*获取task_list数据*/
    function get(index) {
        return store.get('task_list')[index];
    }

    /*添加任务*/
    function add_task(new_task) {
        task_list.push(new_task);
        refresh_task_list();
        return true;
    }

    /*删除任务*/
    function delete_task(index) {
        if(index === undefined || !task_list[index]) return;
        delete task_list[index];
        refresh_task_list();
    }

    /*展示任务详情*/
    function show_task_detail(index) {
        if(index === undefined || !task_list[index]) return;
        render_task_detail(index);
        $task_detail.show();
        $task_detail_mask.show();
    }

    /*隐藏任务详情*/
    function hide_task_detail() {
        $task_detail.hide();
        $task_detail_mask.hide();
    }

    /*构建任务详情*/
    function render_task_detail(index) {
        if(index === undefined || !task_list[index]) return;
        var item = task_list[index];
        var tpl = '<form>' +
            '<div class="content">' +
            item.content +
            '</div>' +
            '<div><input class="input-item" style="display: none" type="text" name="content" value="' + item.content +'"></div>' +
            '<div>' +
            '<div class="desc input-item">' +
            '<textarea name="desc">' + (item.desc || '') + '</textarea>' +
            '</div>' +
            '</div>' +
            '<div class="remind input-item">' +
            '<label>提醒时间</label>' +
            '<input class="datetime" name="remind_date" type="text" value="' + (item.remind_date || '') + '">' +
            '</div>' +
            '<div class="input-item"><button type="submit">更新</button></div>' +
            '</form>';
        $task_detail.html(null);
        $task_detail.html(tpl);
        $('.datetime').datetimepicker();

        $update_form = $task_detail.find('form');
        $update_form_content = $update_form.find('.content');
        $update_form_content_input = $update_form.find('[name=content]');

        $task_detail_mask.on('click', hide_task_detail);

        $update_form_content.on('dblclick', function () {
            console.log('1', 1);
            $update_form_content_input.show();
            $update_form_content.hide();
        });

        $update_form.on('submit', function () {
            var data = {};
            data.content = $(this).find('[name=content]').val();
            data.desc = $(this).find('[name=desc]').val();
            data.remind_date = $(this).find('[name=remind_date]').val();
            update_task(index, data);
            hide_task_detail();
        })

    }

    /*更新任务详情*/
    function update_task(index, data) {
        if(index === undefined || !task_list[index]) return;
        task_list[index] = $.extend({}, task_list[index], data);
        refresh_task_list();
    }

    /*更新存储列表并展示*/
    function refresh_task_list() {
        store.set('task_list', task_list);
        render_task_list();
    }

    /*展示task_list*/
    function render_task_list() {
        var $task_list = $('.tasks-list');
        $task_list.html('');
        var complete_list = [];
        for(var i = 0; i < task_list.length; i++){
            var item = task_list[i];
            if(item && item.complete)
                complete_list[i] = item;
            else {
                var $task = render_task_item(item, i);
                $task_list.prepend($task)
            }
        }

        for(var j = 0; j < complete_list.length; j++){

            var $task = render_task_item(complete_list[j], j);
            if(!$task) continue;
            $task.addClass('complete');
            $task_list.append($task);
        }

        $delete_task = $('.action.delete');
        $detail_task = $('.action.detail');
        $task_item = $('.task-item');
        $checkbox_complete = $('.complete');
        listen_delete_task();
        listen_detail_task();
        listen_checkbox_complete();
    }

    /*构建task-item详情展示*/
    function render_task_item(data, index) {
        if(index === undefined || !data) return;
        var list_item_tpl =
            '<div class="task-item" data-index="' + index + '">' +
            '<span><input class="complete" '+ (data.complete ? 'checked' : '') + ' type="checkbox"></span>' +
            '<span class="task-content">' + data.content + '</span>' +
            '<span class="fr">' +
            '<span class="action delete"> 删除</span>' +
            '<span class="action detail"> 详情</span>' +
            '</span>' +
            '</div>';
        return $(list_item_tpl);
    }

})();