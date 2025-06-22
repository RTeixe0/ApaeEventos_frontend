import GenericForm from "@/components/ATOMIC/molecules/form";
import { createEvent } from "@/services/event_services";
import { FormField } from "@/types/molecules";
import auth from "@react-native-firebase/auth";
// eslint-disable-next-line import/no-unresolved
import storage from "@react-native-firebase/storage";
// eslint-disable-next-line import/no-unresolved
import * as ImagePicker from "expo-image-picker";
import { router, useNavigation } from "expo-router";
import React, { useLayoutEffect, useState } from "react";
import { Alert, Image, ScrollView } from "react-native";

export default function NewEventScreen() {
    const [formData, setFormData] = useState({
        nome: "",
        data: new Date(),
        local: "",
        capacidade: "",
        bannerUrl: "",
    });
    const [bannerUri, setBannerUri] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const navigation = useNavigation();

    useLayoutEffect(() => {
        navigation.setOptions({
            title: "Criar novo evento",
        });
    }, [navigation]);

    const handleInputChange = (field: string) => (value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleDateChange =
        (field: string) => (_event: any, selectedDate?: Date) => {
            if (selectedDate) {
                setFormData((prev) => ({ ...prev, [field]: selectedDate }));
            }
        };

    const [showDatePicker, setShowDatePicker] = useState<{
        [key: string]: boolean;
    }>({});

    const toggleDatePicker = (fieldKey: string, show: boolean) => {
        setShowDatePicker((prev) => ({ ...prev, [fieldKey]: show }));
    };

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permissão negada", "É necessário liberar o acesso às fotos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setBannerUri(asset.uri);
        }
    };

    const submitForm = async () => {
        setLoading(true);
        try {
            const token = await auth().currentUser?.getIdToken();
            if (!token) {
                Alert.alert("Erro", "Usuário não autenticado.");
                return;
            }

            let bannerUrl = formData.bannerUrl;

            if (bannerUri) {
                const fileName = `banner_${Date.now()}`;
                const reference = storage().ref(`banners/${fileName}`);
                await reference.putFile(bannerUri);
                bannerUrl = await reference.getDownloadURL();
                setFormData((prev) => ({ ...prev, bannerUrl }));
            }

            await createEvent(
                {
                    nome: formData.nome,
                    data: formData.data,
                    local: formData.local,
                    capacidade: Number(formData.capacidade),
                    bannerUrl,
                },
                token
            );

            Alert.alert("Sucesso", "Evento cadastrado com sucesso!");

            setFormData({
                nome: "",
                data: new Date(),
                local: "",
                capacidade: "",
                bannerUrl: "",
            });
            setBannerUri(null);
        } catch (error) {
            console.error("Erro ao cadastrar evento:", error);
            Alert.alert("Erro", "Falha ao cadastrar evento.");
        } finally {
            setLoading(false);
            router.back();
        }
    };

    const formFields: FormField[] = [
        {
            key: "nome",
            type: "input",
            props: {
                label: "Nome do Evento *",
                placeholder: "Digite o nome do evento",
                value: formData.nome,
                onChangeText: handleInputChange("nome"),
            },
        },
        {
            key: "local",
            type: "input",
            props: {
                label: "Local do Evento *",
                placeholder: "Digite o local do evento",
                value: formData.local,
                onChangeText: handleInputChange("local"),
            },
        },
        {
            key: "data",
            type: "date",
            props: {
                label: "Data do Evento *",
                placeholder: "XX/XX/XXXX",
                value: formData.data,
                mode: "date",
                onChange: handleDateChange("data"),
            },
        },
        {
            key: "capacidade",
            type: "number",
            props: {
                label: "Número Máximo de Participantes *",
                placeholder: "Digite o número máximo de participantes",
                value: formData.capacidade,
                onChangeText: handleInputChange("capacidade"),
            },
        },
        {
            key: "bannerButton",
            type: "button",
            props: {
                label: bannerUri ? "Trocar Banner" : "Selecionar Banner",
                onPress: handlePickImage,
                variant: "secondary",
                containerStyle: { marginBottom: 16 },
            },
        },

        {
            key: "submitButton",
            type: "button",
            props: {
                label: "Cadastrar Evento",
                onPress: submitForm,
                loading: loading,
            },
        },
    ];
    return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            {bannerUri && (
                <Image
                    source={{ uri: bannerUri }}
                    style={{ width: "100%", height: 200, marginBottom: 16, borderRadius: 16 }}
                />
            )}
            <GenericForm
                fields={formFields}
                title="Digite os dados do novo evento"
                containerStyle={{}}
                showDatePicker={showDatePicker}
                toggleDatePicker={toggleDatePicker}
            />
        </ScrollView>
    );
}
