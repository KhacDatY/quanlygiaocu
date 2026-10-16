package com.example.quanly_giaocu.mapper;

import com.example.quanly_giaocu.dto.request.*;
import com.example.quanly_giaocu.dto.response.UserResponse;
import com.example.quanly_giaocu.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUser(UserCreationRequest request);

    @Mapping(source = "group.name", target = "groupName")
    UserResponse toUserResponse(User user);

    @Mapping(target = "password", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}