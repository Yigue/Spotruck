<?php
include_once '../Model/Model_Inicio.php';
session_start();
$usuario = $_SESSION['usuario'];

if (isset($_POST['btnLogout'])) {
    session_unset();
    session_destroy();
    header('Location:login.php');
}

if (!$_SESSION['ID_USUARIO']) {
    header('Location: login.php');
    exit;
}

if (isset($_POST['btnInicio'])) {

    if($_SESSION['usuario']->TipoUsuario==1){

        header('Location:camionero.php');
    }else{

        header('Location:empresa.php');
    }

}

// Trae la vista
//include_once '../Vista/header.html';
include_once '../Vista/perfil.html';
//include_once '../Vista/pie_vista.php';




?>