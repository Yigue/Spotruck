<?php
include_once '../Model/Model_Inicio.php';
session_start();
// session_unset();
// session_destroy();
// ACA va el Controlar el logeo



// Si el usuario ya estaba logueado
if (isset($_SESSION['usuario'])) {
    // redirecciona  a la pagina sigueinte(dependiendod e que usuario tiene que mandarte a una diferente pagina)
    if ($_SESSION['usuario']->tipoUsuario==1) {
        header('Location:Camionero/camionero.php');
   
    } else {
      
        header('Location:Empresa/empresa.php');
    }
}

$msg = "";


if (isset($_POST['btnLogin'])) {

    // pasamos el contenido de los input a variables
 
    $email = $_POST['txtEmail'];
    $contraseña = $_POST['txtContraseña'];

    // instanciamos el objeto User con los datos de los input
    $usuario = new User($email,$contraseña);

    // si el usuario y contraseña son validos
    if ($usuario->errno == 200) {

        $_SESSION['usuario'] = $usuario;
        $_SESSION['idusuario'] = $usuario->idUsuario;
        $_SESSION['email'] = $usuario->email;
        $_SESSION['contraseña'] = $usuario->contraseña;

        // redirecciona  a la pagina sigueinte(dependiendod e que usuario tiene que mandarte a una diferente pagina)
        if($usuario->tipoUsuario==1){
            header('Location:Camionero/camionero.php');
        }else{
            header('Location:Empresa/empresa.php');
        }
    
    } else { // El usuario y/o contraseña no son validos 
            $msg = "Usuario y/o contraseña invalido/s.";
        
    }
   
}
//
// Trae la vista EN EL SERVER HAY QUE CAMBIARLO
//include_once '../Vista/header.html';
//include_once '../Vista/Login/login.html';
//include_once '../Vista/pie_vista.php';

$tpl_landig = file_get_contents('../Vista/Login/login.html');
$new_landig = str_replace("{{MENSAJE}}", $msg, $tpl_landig);
echo $new_landig;
    ?>