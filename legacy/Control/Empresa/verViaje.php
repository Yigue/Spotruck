<?php
include_once '../../Model/Model_Inicio.php';

session_start();
if (isset($_SESSION['usuario'])) {

    if (isset($_GET['idPubli']) or isset($_SESSION['idpubli'])){
        if(isset($_GET['idPubli'])){
            $_SESSION['idpubli'] = $_GET['idPubli'];
        }
        if (isset($_GET['btnLogout'])) {
            session_unset();
            session_destroy();
            header('Location:../login.php');
        }
        $usuario = $_SESSION['usuario'];
        $tpl_landig = file_get_contents('../../Vista/Empresa/verViaje.html');
        $new_landig = str_replace("{{Nombre}}", $usuario->nombre, $tpl_landig);
        echo $new_landig;
    } else {
        echo "ERROR VOLVER ATRAS";
    }
} else {
    header('Location:../login.php');
}
