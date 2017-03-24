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
// function to get data
function getData() {
    msgRef.on('value', function(snapshot) {
        var dataSet = [];
        $.each( snapshot.val(), function( key, value ) {
            var title = '<a href="#" data-message="'+key+'" class="show-modal-detail">'+value.title+'</a>';
            var act = '<a href="compose.html?id='+key+'" class="btn btn-primary btn-sm" ><i class="fa fa-fw fa-cog" aria-hidden="true"></i></a>';
            var dlvr = '<a href="#" data-toggle="modal" data-target="#list-modal">5 veces</a>';
            var read = '<a href="#" data-toggle="modal" data-target="#list-modal">5 veces</a>';
            dataSet.push([key, title, value.tipo, value.marca, value.date, act, dlvr, read]);
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
                { title: "" }/*,
                { title: "Entregado" },
                { title: "Leído" }*/
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
// realtime listener
firebase.auth().onAuthStateChanged( function(firebaseUser){
    if (!firebaseUser) {
        window.location = 'login.html';
    }
});
// logout
$('#logout').on('click', function(e) {
    e.preventDefault()
    firebase.auth().signOut();
});
// root reference
var rootRef = firebase.database().ref();
// messages reference
var msgRef = rootRef.child('mensajes');
// fill table
getData();
// on detail click; get message content
$('body').on('click', '.show-modal-detail', function(e) {
    e.preventDefault();
    var idMessage = $(this).data('message');
    msgRef.child(idMessage).on('value', function(snapshot) {
        $('#modal-label').empty().html( snapshot.val().title )
        $('#modal-detail .modal-body').empty().html( snapshot.val().contenido );
        $('#modal-detail').modal('show', {backdrop: 'static'});
    });
});
// get id parameter
var id = getParameterByName('id');

if ( id ) { // if message is created
    $('#block-work-area').removeClass('hidden');

    msgRef.child(id).on('value', function(snapshot) {
        console.log( snapshot.val().contenido );
        $('#master-title').html( snapshot.val().title )

        if ( snapshot.val().contenido ) {
            $('#master-title').after( '<div class="content-prev">' + snapshot.val().contenido + '</div>' );
        }else {
            $('#col-control').show();
        }
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
        $('.item').each(function(index, el) {
            cont += $(this).find('.item-content').html(); 
        });

        const promise = msgRef.child(id).update({
            contenido: cont
        });

        promise.then( function(snapshot) {
            window.location = './';
        }).catch( function(e) {
            alert(e.message);
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
}