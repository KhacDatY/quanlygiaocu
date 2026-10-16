package com.example.quanly_giaocu.service;

import com.example.quanly_giaocu.dto.request.FundAllocationRequest;
import com.example.quanly_giaocu.dto.request.GroupCreationRequest;
import com.example.quanly_giaocu.dto.request.GroupUpdateRequest;
import com.example.quanly_giaocu.dto.response.GroupResponse;
import com.example.quanly_giaocu.entity.Group;
import com.example.quanly_giaocu.exception.AppException;
import com.example.quanly_giaocu.exception.ErrorCode;
import com.example.quanly_giaocu.mapper.GroupMapper;
import com.example.quanly_giaocu.repository.GroupRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GroupService {
    GroupRepository groupRepository;
    GroupMapper groupMapper;

    @PreAuthorize("hasRole('DIRECTOR')")
    public GroupResponse createGroup(GroupCreationRequest request) {
        if (groupRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.GROUP_EXISTED);
        }
        Group group = groupMapper.toGroup(request);
        return groupMapper.toGroupResponse(groupRepository.save(group));
    }

    @PreAuthorize("hasAnyRole('DIRECTOR', 'MANAGER', 'ADMIN', 'ACCOUNTANT')")
    public List<GroupResponse> getAllGroups() {
        return groupRepository.findAll().stream()
                .map(groupMapper::toGroupResponse)
                .toList();
    }

    @PreAuthorize("hasRole('DIRECTOR')")
    public GroupResponse getGroup(UUID id) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_EXISTED));
        return groupMapper.toGroupResponse(group);
    }

    @PreAuthorize("hasRole('DIRECTOR')")
    public GroupResponse updateGroup(UUID id, GroupUpdateRequest request) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_EXISTED));

        if (!group.getName().equals(request.getName()) && groupRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.GROUP_EXISTED);
        }

        groupMapper.updateGroup(group, request);
        return groupMapper.toGroupResponse(groupRepository.save(group));
    }

    @PreAuthorize("hasRole('DIRECTOR')")
    public void deleteGroup(UUID id) {
        if (!groupRepository.existsById(id)) {
            throw new AppException(ErrorCode.GROUP_NOT_EXISTED);
        }
        // Lưu ý: Nếu Group đang chứa User, bạn phải xử lý đặt user.setGroup(null) trước khi xóa Group
        // nếu không sẽ bị lỗi khóa ngoại (Foreign Key constraint) ở Database.
        groupRepository.deleteById(id);
    }

    // HÀM CẤP PHÁT TÀI CHÍNH
    @PreAuthorize("hasRole('DIRECTOR')")
    public GroupResponse allocateFund(UUID id, FundAllocationRequest request) {
        Group group = groupRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.GROUP_NOT_EXISTED));

        // Cộng dồn quỹ
        group.setFundBalance(group.getFundBalance() + request.getAmount());
        return groupMapper.toGroupResponse(groupRepository.save(group));
    }
}