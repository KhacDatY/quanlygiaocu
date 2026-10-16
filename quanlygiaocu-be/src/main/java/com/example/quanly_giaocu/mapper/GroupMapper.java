package com.example.quanly_giaocu.mapper;

import com.example.quanly_giaocu.dto.request.GroupCreationRequest;
import com.example.quanly_giaocu.dto.request.GroupUpdateRequest;
import com.example.quanly_giaocu.dto.response.GroupResponse;
import com.example.quanly_giaocu.entity.Group;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface GroupMapper {
    Group toGroup(GroupCreationRequest request);
    GroupResponse toGroupResponse(Group group);
    void updateGroup(@MappingTarget Group group, GroupUpdateRequest request);
}