function post() {
    var jsondata = JSON.stringify( { 'to' : 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'notification' : { 'title' : 'vrummapp.net', 'body'  : 'Nuevo mensaje', 'icon'  : 'new' }, 'data' : { 'date'      : '23/03/17', 'contents'  : 'http://vrummapp.net/msg/view/21659772' } } );
    $.ajax({
        type : 'POST',
        url : "https://fcm.googleapis.com/fcm/send",
        headers : {
            Authorization : 'key=AIzaSyBstTnhwWMqcdJlsE-8QynkxocDXzN9ORU'
        },
        contentType : 'application/json',
        dataType: 'json',
        data: jsondata,
        success : function(response) {
            console.log(response);
        },
        error : function(xhr, status, error) {
            console.log('error');
        }
    });
};
// function to get date time
function getDateTime() {
    var now     = new Date();
    var year    = now.getFullYear();
    var month   = now.getMonth()+1;
    var day     = now.getDate();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    if(month.toString().length == 1) {
        var month = '0'+month;
    }
    if(day.toString().length == 1) {
        var day = '0'+day;
    }
    if(hour.toString().length == 1) {
        var hour = '0'+hour;
    }
    if(minute.toString().length == 1) {
        var minute = '0'+minute;
    }
    var dateSet = [];
    var dateTimeId = day + month + year + hour + minute;
    var date = day + '/' + month + '/' + year;
    dateSet.push(dateTimeId);
    dateSet.push(date);
    return dateSet;
}
// function to get data to main table
function getData() {
    msgRef.on('value', function(snapshot) {
        var dataSet = [];
        $.each( snapshot.val(), function( key, value ) {
            var title = '<a href="#" data-message="'+key+'" class="show-modal-detail">'+value.title+'</a>';
            if( value.comentarios ){
                var numcomm = Object.keys(value.comentarios).length;
                title += ' <span class="label label-danger">'+numcomm+'</span>';
            }
            if( value.enviado ) {
                var act = value.enviado + ' <i class="fa fa-check fa-fw" aria-hidden="true"></i>';
            }else if( value.autorizado ){
                var act = '<a href="#" class="btn btn-success btn-send-push btn-sm" data-id="'+key+'" data-date="'+value.date+'" ><i class="fa fa-fw fa-paper-plane" aria-hidden="true"></i></a>';
            }else {
                var act = '<a href="compose.html?id='+key+'" class="btn btn-primary btn-sm" ><i class="fa fa-fw fa-cog" aria-hidden="true"></i></a>';
            }
            dataSet.push([key, title, value.tipo, value.marca, value.date, act]);
        });
        $.fn.dataTable.moment('DD/MM/YYYY');
        $('#datatable').DataTable({
            destroy: true,
            language: {
                'url': '//cdn.datatables.net/plug-ins/1.10.11/i18n/Spanish.json'
            },
            data: dataSet,
            columns: [
                { title: "ID" },
                { title: "Titulo" },
                { title: "Tipo" },
                { title: "Marca" },
                { title: "Fecha" },
                { title: "" }
            ],
            order: [
                [ 4, "desc" ],
                [ 0, "desc" ]
            ],
            columnDefs: [
                {
                    'width': '40px',
                    'orderable': false,
                    'targets': [-1]
                }
        ]
        });
    });
}
// validate function
function validate(element) {
    var valid = false;
    var parent = element.parent();
    parent.removeClass('has-error').find('.help-block').remove();
    if ( element.val() == '' ) {
        $('<span/>', {
            class: 'help-block',
            text: 'Este campo es  obligatorio'
        }).appendTo(parent);
        parent.addClass('has-error');
    }else {
        parent.removeClass('has-error').find('.help-block').remove();
        valid = true;
    }
    return valid;
}
// parser for url location
function getParameterByName(name, url) {
    if (!url) {
      url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}
// root reference
var rootRef = firebase.database().ref();
// messages reference
var msgRef = rootRef.child('mensajes');
// revisor reference
var revRef = rootRef.child('revisor');
// realtime listener
firebase.auth().onAuthStateChanged( function(firebaseUser){    
    if (!firebaseUser) {
        window.location = 'login.html';
    }else {
        revRef.child(firebaseUser.uid).on('value', function(snapshot) {
            if ( snapshot.val() ) {
                $('.admin').removeClass('hidden')
            }else {
                console.log('no');
            }
        });
    }
});
// logout
$('#logout').on('click', function(e) {
    e.preventDefault()
    firebase.auth().signOut();
});
// fill table
getData();
// on detail click; get message content to modal
$('body').on('click', '.show-modal-detail', function(e) {
    e.preventDefault();
    var idMessage = $(this).data('message');
    msgRef.child(idMessage).on('value', function(snapshot) {
        $('#idMsg').val( idMessage );
        $('#modal-label').empty().html( snapshot.val().title );
        $('#modal-detail .modal-body').empty().html( snapshot.val().contenido );
        $('#modal-detail').modal('show', { backdrop: 'static' });
        $('#comments-box').empty();
        if ( snapshot.val().comentarios ) {
            $('#comments-box').append('<h4>Comentarios</h4>')
            $.each(snapshot.val().comentarios, function(index, el) {
                $('<div/>', {
                    class: 'comment',
                    html: '<hr><h5>'+el.fecha+'</h5><p>'+el.texto+'</p>'
                }).appendTo('#comments-box');
            });
        }
        if ( snapshot.val().autorizado ) {
            $('#comment-form').hide();
        }else {
            $('#comment-form').show();
        }
        //$('#comments').val( snapshot.val().comentarios )
    });
});
// on send click; send push
$('body').on('click', '.btn-send-push', function(e) {
    e.preventDefault();
    post();

    // envio de datos y marcar como enviado
    /*
    var date = $(this).data('date');
    var id = $(this).data('id');
    post(id, date);

    var dateTime = getDateTime();
    var date = dateTime[1];
    sendRef = msgRef.child(id).update({
        enviado: date
    });
    */
});
// get id parameter form url
var id = getParameterByName('id');

if ( id ) { // if message is created
    $('#block-work-area').removeClass('hidden');

    msgRef.child(id).on('value', function(snapshot) {
        $('#master-title, #breadcrumb-active').html( snapshot.val().title )
        $.each( snapshot.val().contenido, function( key, value ) {
            if( value ) {
                $('<li/>', {
                    class: 'ui-state-default item',
                    html: '<div class="item-content">'+value+'</div><a href="#" class="btn btn-default btn-xs delete-item">&times;</a>'
                }).appendTo('#sortable');
            }
        });
    });
    // sortable items
    $('#sortable').sortable({
        placeholder: 'ui-state-highlight'
    });
    // remove item from message
    $('body').on('click', 'a.delete-item', function(e) {
        e.preventDefault();
        $(this).parent().slideUp('fast').promise().done(function(el) {
            el.remove();
        });
    });
    // trigger to get file
    $('#upload-trigger').click(function(e) {
        e.preventDefault();
        $('#input-file').trigger('click');
    });
    // uplaod image
    $('#input-file').on('change', function() {

        $('#uploader').show();
        var imagen = document.getElementById('input-file').files[0];

        // create storage reference
        var storageRef = firebase.storage().ref('mensajes/' + imagen.name);
        var task = storageRef.put(imagen);

        task.on('state_changed', function progress(snapshot){
            var percent = ( snapshot.bytesTransferred / snapshot.totalBytes ) * 100;
            $('#uploader').val(percent);
        }, function(error) {
            alert(error);
        }, function() {
            var downloadURL = task.snapshot.downloadURL;

            $('<li/>', {
                class: 'ui-state-default item item-image',
                html: '<div class="item-content"><img src="'+downloadURL+'" class="img-responsive" /></div><a href="#" class="btn btn-default btn-xs delete-item">&times;</a>'
            }).appendTo('#sortable');

            $('#uploader').fadeOut('slow').promise().done(function(el) {
                el.val('0');
            });
            $('html,body').animate({
                scrollTop: $('ul#sortable li:last').offset().top - 15
            });
        });
    });
    $('#modal-text').on('shown.bs.modal', function () {
        $('trix-editor').focus();
    });
    // reset editor on close modal
    $('#modal-text').on('hidden.bs.modal', function () {
        $('trix-editor').val('').parent().removeClass('has-error').find('.help-block').remove();;
    });
    // add text to message
    $('#add-text').on('click', function(e) {
        e.preventDefault();
        if ( validate( $('trix-editor') ) ) {
            var text = $('#text-content').val();
            $('<li/>', {
                class: 'ui-state-default item item-text',
                html: '<div class="item-content">' + text + '</div><a href="#" class="btn btn-default btn-xs delete-item">&times;</a>'
            }).appendTo('#sortable');
            $('#modal-text').modal('toggle');
            $('html,body').animate({
                scrollTop: $('ul#sortable li:last').offset().top - 15
            });
        }
    });
    // save message content to firebase
    $('#save-message').on('click', function() {
        var cont = '';
        var i = 0;
        $('.item').each(function(index, el) {
            ++i;
            cont = $(this).find('.item-content').html();
            contentRef = msgRef.child(id).child('contenido');
            contentRef.child(i).set(cont);
        }).promise().done(function() {
            window.location = './';
        });
    });

}else { // create message

    //show form
    $('#form-compose').removeClass('hidden');
    // fill brand combo
    $.post( "https://vrummapp.net/ws/v2/catalogo/getmarcas", function(data) {
        $.each(data.mensaje.rs, function(index, val) {
            $('<option/>', {
                val: val.name,
                text: val.name
            }).appendTo('#select-brand');
        });
    });
    // validate on blur or change form fields
    $('.form-control').on('blur', function() {
        validate( $(this) );
    });
    $('.form-control').on('change', function() {
        validate( $(this) );
    });
    // submit message form
    $('#form-compose').on('submit', function() {
        var send = 1;
        $('#form-compose .form-control').each(function(index, el) {
            if ( !validate( $(this) ) ) {
                ++send;
            }
        });
        if ( send == 1 ) {
            $('#btn-submit').button('loading');
            
            var dateTime = getDateTime();
            var idMsg = dateTime[0];
            var date = dateTime[1];
            var brand = $('#select-brand').val();
            var type = $('#select-type').val();
            var title = $('#input-title').val();
            var url = 'http://vrummapp.net/msg/view.html?id='+idMsg;

            const promise = msgRef.child(idMsg).set({
                date: date,
                marca: brand,
                tipo: type,
                title: title,
                url: url
            });
            promise.then( function(snapshot) {
                window.location = 'compose.html?id='+idMsg
            }).catch( function(e) {
                alert(e.message);
            });
        }
        return false;
    });
    $('#btn-comment').on('click', function() {
        var comm = $('#comments');
        if ( validate( comm ) ) {
            var textcomment = comm.val();
            var id = $('#idMsg').val();
            var dateTime = getDateTime();
            var date = dateTime[1];
            //alert(textcomment);
            commentRef = msgRef.child(id).child('comentarios');
            commentRef.push({
                fecha: date,
                texto: textcomment
            });
            $('#modal-detail').modal('toggle');
            $('#comments').val('');
        }
    });
    $('#btn-go').on('click', function(){
        var id = $('#idMsg').val();
        var dateTime = getDateTime();
        var date = dateTime[1];
        autRef = msgRef.child(id).update({
            autorizado: date
        });
        $('#modal-detail').modal('toggle');
        $('#comments').val('');
    });
}