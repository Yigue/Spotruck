
<?php
include_once '../Model/Model_Inicio.php';
session_start();
if (isset($_SESSION['usuario'])) {
    $msg = "";

    $usuario = $_SESSION['usuario'];
    $_SESSION['idTrasportista'] = $usuario->idTrasportista;

    // Boton Delogueo
    if (isset($_GET['btnLogout'])) {
        session_unset();
        session_destroy();
        header('Location:login.php');
    }


    $tpl_landig = file_get_contents('../Vista/Camionero/registerCamion.html');
    $new_landig = str_replace("{{Nombre}}", $_SESSION['usuario']->nombre, $tpl_landig);
    echo $new_landig;
    // include_once '../Vista/Empresa/publicaciones.html';
} else {
    // Sino existe las session
    header('Location:login.php');
}
?>